import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        EmailModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || (() => { throw new Error('FATAL: JWT_SECRET environment variable is not set. Security enforcement failed.') })(),
            signOptions: { expiresIn: '1d' },
        }),
    ],
    providers: [AuthService, JwtStrategy, PrismaService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
