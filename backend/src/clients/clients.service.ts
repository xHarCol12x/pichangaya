import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findByVenue(venueId: string, tenantId: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { id: venueId, tenantId, deletedAt: null },
    });
    if (!venue) {
      throw new NotFoundException('Sede no encontrada o no tienes permisos.');
    }
    return this.prisma.client.findMany({
      where: { venueId, deletedAt: null },
      include: {
        _count: { select: { bookings: { where: { deletedAt: null } } } },
        bookings: {
          where: { deletedAt: null },
          select: { totalPrice: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.client.findMany({
      where: { venue: { tenantId, deletedAt: null }, deletedAt: null },
      include: {
        _count: { select: { bookings: { where: { deletedAt: null } } } },
        bookings: {
          where: { deletedAt: null },
          select: { totalPrice: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    tenantId: string,
    data: {
      name: string;
      phone: string;
      email?: string;
      notes?: string;
      venueId: string;
    },
  ) {
    const venue = await this.prisma.venue.findFirst({
      where: { id: data.venueId, tenantId, deletedAt: null },
    });
    if (!venue) {
      throw new NotFoundException('Sede no encontrada o no tienes permisos.');
    }
    return this.prisma.client.create({ data });
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      notes?: string;
      venueId?: string;
    },
  ) {
    const existing = await this.prisma.client.findFirst({
      where: { id, venue: { tenantId, deletedAt: null }, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(
        'Cliente no encontrado o no tienes permisos.',
      );
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

    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.client.findFirst({
      where: { id, venue: { tenantId, deletedAt: null }, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(
        'Cliente no encontrado o no tienes permisos.',
      );
    }

    // Soft delete
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
