import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req) => {
                    // Extract token from query param (useful for SSE / EventSource)
                    return req?.query?.token;
                }
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'super-secret-key',
        });
    }

    async validate(payload: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isActive: true, subscriptionEndsAt: true }
        });

        if (!user) {
            throw new UnauthorizedException('Cuenta no encontrada.');
        }

        const now = new Date();
        const isExpired = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) <= now;

        if (!user.isActive || (user.role === 'ADMIN' && isExpired)) {
            throw new UnauthorizedException('Tu cuenta está inactiva o tu suscripción ha expirado. Por favor renueva tu plan.');
        }

        return { userId: user.id, email: user.email, role: user.role };
    }
}
