import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Request() req, @Query('limit') limit?: number) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Acesso denegado. Se requiere rol de SUPER_ADMIN.',
      );
    }
    return this.auditService.findAll(limit ? Number(limit) : 50);
  }
}
