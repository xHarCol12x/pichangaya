import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    // Public endpoint for landing page and signups
    @Get()
    findAllActive() {
        return this.plansService.findAllActive();
    }

    // Protected endpoints for Super Admin
    @UseGuards(JwtAuthGuard)
    @Get('all')
    findAll(@Request() req) {
        if (req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Solo para Super Admin');
        return this.plansService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    updatePlan(@Param('id') id: string, @Body() body: any, @Request() req) {
        if (req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Solo para Super Admin');
        return this.plansService.update(id, body, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    createPlan(@Body() body: any, @Request() req) {
        if (req.user.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Solo para Super Admin');
        return this.plansService.create(body, req.user.userId);
    }
}
