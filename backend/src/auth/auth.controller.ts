import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: { email: string }) {
    await this.authService.forgotPassword(body.email);
    return {
      message:
        'Si ese correo está registrado, recibirás las instrucciones en breve.',
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return {
      message:
        'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout() {
    return { message: 'Sesión cerrada exitosamente.' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('impersonate/:id')
  @HttpCode(200)
  async impersonate(@Param('id') targetUserId: string, @Request() req) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException(
        'No tienes permisos suficientes para esta acción estratégica.',
      );
    }
    return this.authService.impersonate(targetUserId);
  }
}
