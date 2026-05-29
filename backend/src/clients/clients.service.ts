import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

    async findByVenue(venueId: string, ownerId: string) {
        const venue = await this.prisma.venue.findFirst({ where: { id: venueId, ownerId, deletedAt: null } });
        if (!venue) {
            throw new NotFoundException('Sede no encontrada o no tienes permisos.');
        }
        return this.prisma.client.findMany({
            where: { venueId, deletedAt: null },
            include: {
                _count: { select: { bookings: { where: { deletedAt: null } } } },
                bookings: {
                    where: { deletedAt: null },
                    select: { totalPrice: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByOwner(ownerId: string) {
        return this.prisma.client.findMany({
            where: { venue: { ownerId, deletedAt: null }, deletedAt: null },
            include: {
                _count: { select: { bookings: { where: { deletedAt: null } } } },
                bookings: {
                    where: { deletedAt: null },
                    select: { totalPrice: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async create(ownerId: string, data: { name: string; phone: string; email?: string; notes?: string; venueId: string }) {
        const venue = await this.prisma.venue.findFirst({
            where: { id: data.venueId, ownerId, deletedAt: null }
        });
        if (!venue) {
            throw new NotFoundException('Sede no encontrada o no tienes permisos.');
        }
        return this.prisma.client.create({ data });
    }

    async update(id: string, ownerId: string, data: { name?: string; phone?: string; email?: string; notes?: string; venueId?: string }) {
        const existing = await this.prisma.client.findFirst({
            where: { id, venue: { ownerId, deletedAt: null }, deletedAt: null }
        });
        if (!existing) {
            throw new NotFoundException('Cliente no encontrado o no tienes permisos.');
        }

        if (data.venueId && data.venueId !== existing.venueId) {
            const venue = await this.prisma.venue.findFirst({ where: { id: data.venueId, ownerId, deletedAt: null } });
            if (!venue) {
                throw new NotFoundException('La nueva sede no pertenece a este usuario o ha sido eliminada.');
            }
        }

        return this.prisma.client.update({ where: { id }, data });
    }

    async remove(id: string, ownerId: string) {
        const existing = await this.prisma.client.findFirst({
            where: { id, venue: { ownerId, deletedAt: null }, deletedAt: null }
        });
        if (!existing) {
            throw new NotFoundException('Cliente no encontrado o no tienes permisos.');
        }
        
        // Soft delete
        return this.prisma.client.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
