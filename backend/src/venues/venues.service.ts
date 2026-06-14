import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Venue } from '@prisma/client';

@Injectable()
export class VenuesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<Venue[]> {
    return this.prisma.venue.findMany({
      where: { tenantId, deletedAt: null },
      include: { fields: { where: { deletedAt: null } } },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Venue | null> {
    const venue = await this.prisma.venue.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { fields: { where: { deletedAt: null } } },
    });
    if (!venue) {
      throw new NotFoundException('Sede no encontrada.');
    }
    return venue;
  }

  async create(
    tenantId: string,
    data: { name: string; address: string; description?: string },
  ): Promise<Venue> {
    // 1. Get tenant and their plan
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: tenant.plan },
    });

    if (!plan) throw new ForbiddenException('Plan de suscripción no válido');

    // 2. Count current active venues
    const currentVenuesCount = await this.prisma.venue.count({
      where: { tenantId, deletedAt: null },
    });

    // 3. Validate limit
    if (currentVenuesCount >= plan.limitVenues) {
      throw new ForbiddenException(
        `Has alcanzado el límite de sedes (${plan.limitVenues}) para el plan ${plan.name}. Mejora tu suscripción.`,
      );
    }

    return this.prisma.venue.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: { name?: string; address?: string; description?: string },
  ): Promise<Venue> {
    const existing = await this.prisma.venue.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Sede no encontrada o no tienes permisos.');
    }
    return this.prisma.venue.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string): Promise<Venue> {
    const existing = await this.prisma.venue.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Sede no encontrada o no tienes permisos.');
    }

    // Soft delete
    return this.prisma.venue.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
