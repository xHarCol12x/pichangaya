import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    action: string,
    entityId: string,
    entityType: string,
    userId?: string,
    details?: any,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entityId,
          entityType,
          userId,
          details: details ? JSON.parse(JSON.stringify(details)) : null,
        },
      });
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }

  async findAll(limit: number = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
