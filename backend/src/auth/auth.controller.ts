import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, Param, UnauthorizedException, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as express from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    private setRefreshCookie(res: express.Response, token: string) {
        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Needed for CORS if not same domain
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    @Post('register')
    async register(
        @Body() registerDto: RegisterDto, 
        @Res({ passthrough: true }) res: express.Response,
        @Request() req: any
    ) {
        const result = await this.authService.register(
            registerDto, 
            req.headers['user-agent'], 
            req.ip
        );
        this.setRefreshCookie(res, result.refresh_token);
        const { refresh_token, ...response } = result;
        return response;
    }

    @Post('login')
    @HttpCode(200)
    async login(
        @Body() loginDto: LoginDto, 
        @Res({ passthrough: true }) res: express.Response,
        @Request() req: any
    ) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        const result = await this.authService.login(
            user, 
            req.headers['user-agent'], 
            req.ip
        );
        this.setRefreshCookie(res, result.refresh_token);
        const { refresh_token, ...response } = result;
        return response;
    }

    @Post('refresh')
    @HttpCode(200)
    async refresh(
        @Request() req: any,
        @Res({ passthrough: true }) res: express.Response
    ) {
        const token = req.cookies['refresh_token'];
        if (!token) throw new UnauthorizedException('No hay token de refresco');

        const result = await this.authService.refresh(
            token, 
            req.headers['user-agent'], 
            req.ip
        );
        this.setRefreshCookie(res, result.refresh_token);
        const { refresh_token, ...response } = result;
        return response;
    }

    @Post('forgot-password')
    @HttpCode(200)
    async forgotPassword(@Body() body: { email: string }) {
        await this.authService.forgotPassword(body.email);
        return { message: 'Si ese correo está registrado, recibirás las instrucciones en breve.' };
    }

    @Post('reset-password')
    @HttpCode(200)
    async resetPassword(@Body() body: { token: string; newPassword: string }) {
        await this.authService.resetPassword(body.token, body.newPassword);
        return { message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @Post('logout')
    @HttpCode(200)
    async logout(
        @Request() req: any,
        @Res({ passthrough: true }) res: express.Response
    ) {
        const token = req.cookies['refresh_token'];
        if (token) {
            await this.authService.logout(token);
        }
        res.clearCookie('refresh_token');
        return { message: 'Sesión cerrada exitosamente.' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('impersonate/:id')
    @HttpCode(200)
    async impersonate(
        @Param('id') targetUserId: string, 
        @Request() req: any,
        @Res({ passthrough: true }) res: express.Response
    ) {
        if (req.user.role !== 'SUPER_ADMIN') {
            throw new UnauthorizedException('No tienes permisos suficientes para esta acción estratégica.');
        }
        const result = await this.authService.impersonate(
            targetUserId, 
            req.headers['user-agent'], 
            req.ip
        );
        this.setRefreshCookie(res, result.refresh_token);
        const { refresh_token, ...response } = result;
        return response;
    }
}
