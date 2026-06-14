import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Field } from '@prisma/client';

@Injectable()
export class FieldsService {
  constructor(private prisma: PrismaService) {}

  async findAllByTenant(tenantId: string): Promise<Field[]> {
    return this.prisma.field.findMany({
      where: { venue: { tenantId }, deletedAt: null },
      include: { venue: true },
    });
  }

  async findByVenue(venueId: string, tenantId: string): Promise<Field[]> {
    const venue = await this.prisma.venue.findFirst({
      where: { id: venueId, tenantId, deletedAt: null },
    });
    if (!venue) {
      throw new NotFoundException('Sede no encontrada o no tienes permisos.');
    }
    return this.prisma.field.findMany({
      where: { venueId, deletedAt: null },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Field | null> {
    const field = await this.prisma.field.findFirst({
      where: { id, venue: { tenantId }, deletedAt: null },
      include: { venue: true },
    });
    if (!field) {
      throw new NotFoundException('Cancha no encontrada.');
    }
    return field;
  }

  async create(
    tenantId: string,
    data: {
      name: string;
      type: string;
      surface?: string;
      pricePerHour: number;
      venueId: string;
    },
  ): Promise<Field> {
    const venue = await this.prisma.venue.findFirst({
      where: { id: data.venueId, tenantId, deletedAt: null },
    });
    if (!venue) {
      throw new NotFoundException('Sede no encontrada o no tienes permisos.');
    }

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

    // 2. Count current active fields for this tenant (across all venues)
    const currentFieldsCount = await this.prisma.field.count({
      where: { venue: { tenantId }, deletedAt: null },
    });

    // 3. Validate limit
    if (currentFieldsCount >= plan.limitFields) {
      throw new ForbiddenException(
        `Has alcanzado el límite de canchas (${plan.limitFields}) para el plan ${plan.name}. Mejora tu suscripción.`,
      );
    }

    return this.prisma.field.create({
      data: {
        name: data.name,
        type: data.type,
        surface: data.surface,
        pricePerHour: data.pricePerHour,
        venue: { connect: { id: data.venueId } },
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      type?: string;
      surface?: string;
      pricePerHour?: number;
      venueId?: string;
    },
  ): Promise<Field> {
    const existing = await this.prisma.field.findFirst({
      where: { id, venue: { tenantId }, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Cancha no encontrada o no tienes permisos.');
    }

    if (data.venueId && data.venueId !== existing.venueId) {
      const venue = await this.prisma.venue.findFirst({
        where: { id: data.venueId, tenantId, deletedAt: null },
      });
      if (!venue) {
        throw new NotFoundException(
          'La nueva sede no pertenece a tu organización.',
        );
      }
    }

    const { venueId, ...rest } = data;
    return this.prisma.field.update({
      where: { id },
      data: {
        ...rest,
        ...(venueId ? { venue: { connect: { id: venueId } } } : {}),
      },
    });
  }

  async remove(id: string, tenantId: string): Promise<Field> {
    const existing = await this.prisma.field.findFirst({
      where: { id, venue: { tenantId }, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Cancha no encontrada o no tienes permisos.');
    }

    // Soft delete
    return this.prisma.field.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
