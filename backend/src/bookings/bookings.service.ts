import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Booking, Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
    constructor(private prisma: PrismaService) { }

    async findAllForOwner(ownerId: string): Promise<Booking[]> {
        return this.prisma.booking.findMany({
            where: { field: { venue: { ownerId } } },
            include: { user: true, field: { include: { venue: true } }, client: true },
            orderBy: { startTime: 'asc' },
        });
    }

    async findByUser(userId: string): Promise<Booking[]> {
        return this.prisma.booking.findMany({
            where: { userId },
            include: { field: { include: { venue: true } } },
        });
    }

    async findOne(id: string): Promise<Booking | null> {
        return this.prisma.booking.findUnique({
            where: { id },
            include: { user: true, field: true },
        });
    }

    async create(data: Prisma.BookingCreateInput): Promise<Booking> {
        // Basic collision check (real implementation would be more complex)
        const existing = await this.prisma.booking.findFirst({
            where: {
                fieldId: data.field.connect?.id,
                startTime: { lt: data.endTime },
                endTime: { gt: data.startTime },
                status: 'CONFIRMED',
            },
        });

        if (existing) {
            throw new ConflictException('Esta cancha ya está reservada para ese horario.');
        }

        return this.prisma.booking.create({ data });
    }

    async update(id: string, data: Prisma.BookingUpdateInput): Promise<Booking> {
        return this.prisma.booking.update({
            where: { id },
            data,
        });
    }

    async remove(id: string): Promise<Booking> {
        return this.prisma.booking.delete({
            where: { id },
        });
    }
}
