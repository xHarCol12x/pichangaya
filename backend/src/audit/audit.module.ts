import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  providers: [AuditService, typeof PrismaService !== 'undefined' ? PrismaService : Object],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule { }
