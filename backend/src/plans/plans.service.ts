import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PlansService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAllActive() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMensual: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { priceMensual: 'asc' },
    });
  }

  async update(id: string, data: any, userId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const updatedPlan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });

    await this.auditService.log(
      'PLAN_UPDATED',
      updatedPlan.id,
      'SubscriptionPlan',
      userId,
      { oldCode: plan.code, newCode: updatedPlan.code, changes: data },
    );

    return updatedPlan;
  }

  async create(data: any, userId: string) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { code: data.code },
    });
    if (existing) throw new BadRequestException('El código del plan ya existe');

    const newPlan = await this.prisma.subscriptionPlan.create({
      data,
    });

    await this.auditService.log(
      'PLAN_CREATED',
      newPlan.id,
      'SubscriptionPlan',
      userId,
      { planCode: newPlan.code, initialData: data },
    );

    return newPlan;
  }
}
