import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        console.log(`[STABILITY-LOG] Validation attempt for: ${email}`);
        try {
            if (!email) {
                console.error('[STABILITY-LOG] Email is missing in validateUser');
                throw new BadRequestException('El correo es obligatorio');
            }
            
            const user = await this.usersService.findOne(email);
            if (!user) {
                console.log(`[STABILITY-LOG] User not found: ${email}`);
                throw new UnauthorizedException('No encontramos ninguna cuenta con ese correo.');
            }

            console.log(`[STABILITY-LOG] User found in DB, comparing passwords...`);
            const isMatch = await bcrypt.compare(pass, user.password);
            if (!isMatch) {
                console.log(`[STABILITY-LOG] Password mismatch for: ${email}`);
                throw new UnauthorizedException('Contraseña incorrecta. Por favor verifica e intenta de nuevo.');
            }

            console.log(`[STABILITY-LOG] Password matches. Success for: ${email}`);
            
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.plan,
                isActive: user.isActive,
                subscriptionEndsAt: user.subscriptionEndsAt,
                featureOverrides: user.featureOverrides
            };
        } catch (err) {
            console.error('[STABILITY-LOG] ERROR in validateUser:', err.message, err.stack);
            throw err;
        }
    }

    async login(user: any) {
        console.log(`[STABILITY-LOG] Starting login construction for user: ${user.email}`);
        try {
            let isActuallyActive = user.isActive;
            // Logic for subscription expiry
            if (isActuallyActive && user.subscriptionEndsAt) {
                const now = new Date();
                if (new Date(user.subscriptionEndsAt) <= now) {
                    console.log(`[STABILITY-LOG] User subscription expired: ${user.email}`);
                    isActuallyActive = false;
                }
            }

            const payload = {
                email: user.email,
                sub: user.id,
                role: user.role,
                plan: user.plan,
                isActive: isActuallyActive,
                subscriptionEndsAt: user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt).toISOString() : null
            };

            console.log(`[STABILITY-LOG] Payload constructed, fetching plan permissions...`);
            let planObjPermissions = {};
            try {
                if (user.plan) {
                    const planObj = await this.prisma.subscriptionPlan.findUnique({ where: { code: user.plan } });
                    planObjPermissions = planObj?.permissions || {};
                    console.log(`[STABILITY-LOG] Plan found: ${user.plan}`);
                } else {
                    console.warn(`[STABILITY-LOG] User has no plan code: ${user.email}`);
                }
            } catch (e) {
                console.error('[STABILITY-LOG] Error fetching plan permissions during login:', e);
            }

            // Ensure featureOverrides is an object
            let featureOverrides = user.featureOverrides || {};
            if (typeof featureOverrides === 'string') {
                try {
                    featureOverrides = JSON.parse(featureOverrides);
                    console.log(`[STABILITY-LOG] Parsed featureOverrides from string for: ${user.email}`);
                } catch (e) {
                    console.error('[STABILITY-LOG] Failed to parse featureOverrides string:', e);
                    featureOverrides = {};
                }
            }

            console.log(`[STABILITY-LOG] Signing JWT...`);
            const token = this.jwtService.sign(payload);
            console.log(`[STABILITY-LOG] JWT Signed successfully.`);

            return {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    plan: user.plan,
                    isActive: isActuallyActive,
                    subscriptionEndsAt: user.subscriptionEndsAt,
                    featureOverrides: featureOverrides,
                    planPermissions: planObjPermissions
                },
            };
        } catch (err) {
            console.error('[STABILITY-LOG] Fatal error during login payload construction:', err.message, err.stack);
            throw err;
        }
    }

    async impersonate(userIdToImpersonate: string) {
        const user = await this.usersService.findById(userIdToImpersonate);
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }
        return this.login(user); // returns token and user data for the target user
    }

    async register(data: any) {
        // Check if email already exists
        const existingUser = await this.usersService.findOne(data.email).catch(() => null);
        if (existingUser) {
            throw new ConflictException('Este correo ya tiene una cuenta registrada.');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        let subscriptionEndsAt: Date | null = null;
        let plan = data.plan ? data.plan.toUpperCase() : 'FREE_TRIAL';
        let isActive = true;

        if (plan === 'TRIAL' || plan === 'FREE_TRIAL' || plan === 'PRUEBA') {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            subscriptionEndsAt = date;
            plan = 'FREE_TRIAL';
            isActive = true;
        } else {
            // Paid plans start as inactive until payment confirmation (webhook)
            isActive = false;
        }

        const user = await this.usersService.create({
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role || 'ADMIN',
            plan: plan as any,
            subscriptionEndsAt: subscriptionEndsAt,
            isActive: isActive
        });

        // Send welcome email (non-blocking)
        try {
            await this.emailService.sendWelcomeEmail(user.name || 'Usuario', user.email);
        } catch (err) {
            console.error('Failed to send welcome email:', err);
        }

        return this.login(user);
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await this.usersService.findOne(email).catch(() => null);
        if (!user) return; // Silent success for security

        // Create new token valid for 1 hour
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

        // Invalidate previous tokens
        await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }).catch(() => null);

        await this.prisma.passwordResetToken.create({
            data: { token, userId: user.id, expiresAt },
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        await this.emailService.sendPasswordResetEmail(user.email, resetLink);
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });

        if (!record || record.used || new Date() > record.expiresAt) {
            throw new BadRequestException('El link no es válido o ya ha expirado.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { id: record.userId },
            data: { password: hashedPassword },
        });

        await this.prisma.passwordResetToken.update({
            where: { token },
            data: { used: true },
        });
    }
}
