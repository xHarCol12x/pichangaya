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

  async findAllByOwner(ownerId: string): Promise<Field[]> {
    return this.prisma.field.findMany({
      where: { venue: { ownerId }, deletedAt: null },
      include: { venue: true },
    });
  }

  async findByVenue(venueId: string, ownerId: string): Promise<Field[]> {
    const venue = await this.prisma.venue.findFirst({
      where: { id: venueId, ownerId, deletedAt: null },
    });
    if (!venue) {
      throw new NotFoundException('Sede no encontrada o no tienes permisos.');
    }
    return this.prisma.field.findMany({
      where: { venueId, deletedAt: null },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Field | null> {
    const field = await this.prisma.field.findFirst({
      where: { id, venue: { ownerId }, deletedAt: null },
      include: { venue: true },
    });
    if (!field) {
      throw new NotFoundException('Cancha no encontrada.');
    }
    return field;
  }

  async create(
    ownerId: string,
    data: {
      name: string;
      type: string;
      surface?: string;
      pricePerHour: number;
      venueId: string;
    },
  ): Promise<Field> {
    const venue = await this.prisma.venue.findFirst({
      where: { id: data.venueId, ownerId, deletedAt: null },
    });
    if (!venue) {
      throw new NotFoundException('Sede no encontrada o no tienes permisos.');
    }

    // 1. Get user and their plan
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { plan: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: user.plan },
    });

    if (!plan) throw new ForbiddenException('Plan de suscripción no válido');

    // 2. Count current active fields for this user (across all venues)
    const currentFieldsCount = await this.prisma.field.count({
      where: { venue: { ownerId }, deletedAt: null },
    });

    // 3. Validate limit
    if (currentFieldsCount >= plan.limitFields) {
      throw new ForbiddenException(
        `Has alcanzado el límite de canchas (${plan.limitFields}) para tu plan ${plan.name}. Mejora tu suscripción.`,
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
    ownerId: string,
    data: {
      name?: string;
      type?: string;
      surface?: string;
      pricePerHour?: number;
      venueId?: string;
    },
  ): Promise<Field> {
    const existing = await this.prisma.field.findFirst({
      where: { id, venue: { ownerId }, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Cancha no encontrada o no tienes permisos.');
    }

    if (data.venueId && data.venueId !== existing.venueId) {
      const venue = await this.prisma.venue.findFirst({
        where: { id: data.venueId, ownerId, deletedAt: null },
      });
      if (!venue) {
        throw new NotFoundException(
          'La nueva sede no pertenece a este usuario o ha sido eliminada.',
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

  async remove(id: string, ownerId: string): Promise<Field> {
    const existing = await this.prisma.field.findFirst({
      where: { id, venue: { ownerId }, deletedAt: null },
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
