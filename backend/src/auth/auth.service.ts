import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID, createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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
        throw new UnauthorizedException(
          'No encontramos ninguna cuenta con ese correo.',
        );
      }

      console.log(`[STABILITY-LOG] User found in DB, comparing passwords...`);
      const isMatch = await bcrypt.compare(pass, user.password);
      if (!isMatch) {
        console.log(`[STABILITY-LOG] Password mismatch for: ${email}`);
        throw new UnauthorizedException(
          'Contraseña incorrecta. Por favor verifica e intenta de nuevo.',
        );
      }

      console.log(`[STABILITY-LOG] Password matches. Success for: ${email}`);

      return user;
    } catch (err) {
      console.error(
        '[STABILITY-LOG] ERROR in validateUser:',
        err.message,
        err.stack,
      );
      throw err;
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async createSession(userId: string, userAgent?: string, ip?: string) {
    const refreshToken = randomUUID();
    const tokenHash = this.hashToken(refreshToken);

    // Session valid for 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        userAgent,
        ipAddress: ip,
        expiresAt,
      },
    });

    return refreshToken;
  }

  async login(user: any, userAgent?: string, ip?: string) {
    console.log(
      `[STABILITY-LOG] Starting login construction for user: ${user.email}`,
    );
    try {
      // Fetch user with memberships to get tenant info
      const userWithMemberships = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { memberships: { include: { tenant: true } } },
      });

      const isActuallyActive = this.usersService.calculateEffectiveStatus(user);
      const memberships = userWithMemberships?.memberships || [];

      // For now, we use the first tenant as the default context
      const defaultTenant = memberships[0]?.tenant;

      const payload = {
        email: user.email,
        sub: user.id,
        role: user.role,
        plan: user.plan,
        isActive: isActuallyActive,
        subscriptionEndsAt: user.subscriptionEndsAt
          ? new Date(user.subscriptionEndsAt).toISOString()
          : null,
        tenantId: defaultTenant?.id || null,
        tenantRole: memberships[0]?.role || null,
      };

      console.log(
        `[STABILITY-LOG] Payload constructed, fetching plan permissions...`,
      );
      const planObjPermissions = await this.usersService.resolvePlanPermissions(
        user.plan,
      );

      // Ensure featureOverrides is an object
      let featureOverrides = user.featureOverrides || {};
      if (typeof featureOverrides === 'string') {
        try {
          featureOverrides = JSON.parse(featureOverrides);
        } catch (e) {
          featureOverrides = {};
        }
      }

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = await this.createSession(user.id, userAgent, ip);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          isActive: isActuallyActive,
          subscriptionEndsAt: user.subscriptionEndsAt,
          featureOverrides: featureOverrides,
          planPermissions: planObjPermissions,
        },
      };
    } catch (err) {
      console.error(
        '[STABILITY-LOG] Fatal error during login payload construction:',
        err.message,
        err.stack,
      );
      throw err;
    }
  }

  async refresh(token: string, userAgent?: string, ip?: string) {
    const tokenHash = this.hashToken(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session)
        await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Sesión expirada o inválida');
    }

    // Rotate token: delete old, create new
    await this.prisma.session.delete({ where: { id: session.id } });

    return this.login(session.user, userAgent, ip);
  }

  async logout(token: string) {
    const tokenHash = this.hashToken(token);
    await this.prisma.session.deleteMany({
      where: { tokenHash },
    });
  }

  async impersonate(
    userIdToImpersonate: string,
    userAgent?: string,
    ip?: string,
  ) {
    const user = await this.usersService.findById(userIdToImpersonate);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.login(user, userAgent, ip);
  }

  async register(data: any, userAgent?: string, ip?: string) {
    const existingUser = await this.usersService
      .findOne(data.email)
      .catch(() => null);
    if (existingUser) {
      throw new ConflictException(
        'Este correo ya tiene una cuenta registrada.',
      );
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
    } else {
      isActive = false;
    }

    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: 'ADMIN',
      plan: plan,
      subscriptionEndsAt: subscriptionEndsAt,
      isActive: isActive,
    });

    try {
      await this.emailService.sendWelcomeEmail(
        user.name || 'Usuario',
        user.email,
      );
    } catch (err) {}

    return this.login(user, userAgent, ip);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOne(email).catch(() => null);
    if (!user) return; // Silent success for security

    // Create new token valid for 1 hour
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Invalidate previous tokens
    await this.prisma.passwordResetToken
      .deleteMany({ where: { userId: user.id } })
      .catch(() => null);

    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetEmail(user.email, resetLink);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

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
