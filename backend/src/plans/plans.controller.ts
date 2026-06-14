import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // Public endpoint for landing page and signups
  @Get()
  findAllActive() {
    return this.plansService.findAllActive();
  }

  // Protected endpoints for Super Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('all')
  findAll() {
    return this.plansService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id')
  updatePlan(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.plansService.update(id, body, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post()
  createPlan(@Body() body: any, @Request() req) {
    return this.plansService.create(body, req.user.userId);
  }
}
