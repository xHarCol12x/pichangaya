import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    // GET /users/me — perfil del usuario autenticado (para el TopBar)
    @Get('me')
    getMe(@Request() req: any) {
        return this.usersService.findMe(req.user.userId);
    }

    // GET /users/tenants — lista todos los tenants (ADMIN)
    @Get('tenants')
    findTenants() {
        return this.usersService.findTenants();
    }

    // GET /users/tenants/:id — detalle completo de un tenant
    @Get('tenants/:id')
    findTenantById(@Param('id') id: string) {
        return this.usersService.findTenantById(id);
    }

    // PATCH /users/tenants/:id/subscription — actualizar suscripción
    @Patch('tenants/:id/subscription')
    updateSubscription(
        @Param('id') id: string,
        @Body() body: {
            plan?: string;
            isActive?: boolean;
            subscriptionEndsAt?: string | null;
            extendDays?: number;
        }
    ) {
        return this.usersService.updateTenantSubscription(id, body);
    }
}