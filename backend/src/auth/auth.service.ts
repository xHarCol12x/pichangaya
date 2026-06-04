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
        try {
            if (!email) {
                throw new BadRequestException('El correo es obligatorio');
            }
            
            const user = await this.usersService.findOne(email);
            if (!user) {
                throw new UnauthorizedException('No encontramos ninguna cuenta con ese correo.');
            }

            const isMatch = await bcrypt.compare(pass, user.password);
            if (!isMatch) {
                throw new UnauthorizedException('Contraseña incorrecta. Por favor verifica e intenta de nuevo.');
            }

            
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
            throw err;
        }
    }

    async login(user: any) {
        try {
            let isActuallyActive = user.isActive;
            // Logic for subscription expiry
            if (isActuallyActive && user.subscriptionEndsAt) {
                const now = new Date();
                if (new Date(user.subscriptionEndsAt) <= now) {
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

            let planObjPermissions = {};
            try {
                if (user.plan) {
                    const planObj = await this.prisma.subscriptionPlan.findUnique({ where: { code: user.plan } });
                    planObjPermissions = planObj?.permissions || {};
                }
            } catch (e) {
            }

            // Ensure featureOverrides is an object
            let featureOverrides = user.featureOverrides || {};
            if (typeof featureOverrides === 'string') {
                try {
                    featureOverrides = JSON.parse(featureOverrides);
                } catch (e) {
                    featureOverrides = {};
                }
            }

            const token = this.jwtService.sign(payload);

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
