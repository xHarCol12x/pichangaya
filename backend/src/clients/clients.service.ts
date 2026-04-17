import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

    async findByVenue(venueId: string) {
        return this.prisma.client.findMany({
            where: { venueId },
            include: {
                _count: { select: { bookings: true } },
                bookings: {
                    select: { totalPrice: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByOwner(ownerId: string) {
        return this.prisma.client.findMany({
            where: { venue: { ownerId } },
            include: {
                _count: { select: { bookings: true } },
                bookings: {
                    select: { totalPrice: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async create(data: { name: string; phone: string; email?: string; notes?: string; venueId: string }) {
        return this.prisma.client.create({ data });
    }

    async update(id: string, data: { name?: string; phone?: string; email?: string; notes?: string }) {
        return this.prisma.client.update({ where: { id }, data });
    }

    async remove(id: string) {
        return this.prisma.client.delete({ where: { id } });
    }
}
