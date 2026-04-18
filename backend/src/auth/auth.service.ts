import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        console.log(`[AUTH] Validating user: ${email}`);
        try {
            const user = await this.usersService.findOne(email);
            if (!user) {
                console.log(`[AUTH] User not found: ${email}`);
                return null;
            }

            const isPasswordValid = await bcrypt.compare(pass, user.password);
            if (!isPasswordValid) {
                console.log(`[AUTH] Invalid password for user: ${email}`);
                return null;
            }

            console.log(`[AUTH] User validated successfully: ${email}`);
            const { password, ...result } = user;
            return result;
        } catch (error) {
            console.error(`[AUTH] Error during validateUser for ${email}:`, error);
            throw error;
        }
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            plan: user.plan,
            isActive: user.isActive,
            subscriptionEndsAt: user.subscriptionEndsAt
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.plan,
                isActive: user.isActive,
                subscriptionEndsAt: user.subscriptionEndsAt
            },
        };
    }

    async register(data: any) {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        let subscriptionEndsAt: Date | null = null;
        let plan = data.plan ? data.plan.toUpperCase() : 'FREE_TRIAL';

        if (plan === 'TRIAL' || plan === 'FREE_TRIAL' || plan === 'PRUEBA') {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            subscriptionEndsAt = date;
            plan = 'FREE_TRIAL';
        } else if (plan === 'STARTER') {
            plan = 'BASIC';
        }

        const user = await this.usersService.create({
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role || 'ADMIN',
            plan: plan as any,
            subscriptionEndsAt: subscriptionEndsAt
        });
        return this.login(user);
    }
}
