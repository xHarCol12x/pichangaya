import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles(Role.SUPER_ADMIN)
    findAll() {
        return this.usersService.findAll();
    }

    // GET /users/me — perfil del usuario autenticado (para el TopBar)
    @Get('me')
    getMe(@Request() req: any) {
        return this.usersService.findMe(req.user.userId);
    }

    // PATCH /users/settings — actualizar ajustes del usuario (ej: dashboardLayout)
    @Patch('settings')
    updateSettings(@Request() req: any, @Body() body: { featureOverrides?: any }) {
        return this.usersService.updateMySettings(req.user.userId, body);
    }

    // GET /users/tenants — lista todos los tenants (ADMIN)
    @Get('tenants')
    @Roles(Role.SUPER_ADMIN)
    findTenants() {
        return this.usersService.findTenants();
    }

    // GET /users/tenants/:id — detalle completo de un tenant
    @Get('tenants/:id')
    @Roles(Role.SUPER_ADMIN)
    findTenantById(@Param('id') id: string) {
        return this.usersService.findTenantById(id);
    }

    // PATCH /users/tenants/:id/subscription — actualizar suscripción
    @Patch('tenants/:id/subscription')
    @Roles(Role.SUPER_ADMIN)
    updateSubscription(
        @Param('id') id: string,
        @Body() body: {
            plan?: string;
            isActive?: boolean;
            subscriptionEndsAt?: string | null;
            extendDays?: number;
            featureOverrides?: any;
        }
    ) {
        return this.usersService.updateTenantSubscription(id, body);
    }
}