import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Booking } from '@prisma/client';

@Injectable()
export class BookingsService {
    constructor(private prisma: PrismaService) { }

    async findAllForOwner(ownerId: string): Promise<Booking[]> {
        return this.prisma.booking.findMany({
            where: { 
                field: { venue: { ownerId } },
                deletedAt: null 
            },
            include: { user: true, field: { include: { venue: true } }, client: true },
            orderBy: { startTime: 'asc' },
        });
    }

    async findByUser(userId: string): Promise<Booking[]> {
        return this.prisma.booking.findMany({
            where: { 
                userId,
                deletedAt: null
            },
            include: { field: { include: { venue: true } } },
        });
    }

    async findOne(id: string, ownerId: string): Promise<Booking | null> {
        const booking = await this.prisma.booking.findFirst({
            where: {
                id,
                deletedAt: null,
                OR: [
                    { userId: ownerId },
                    { field: { venue: { ownerId } } }
                ]
            },
            include: { user: true, field: { include: { venue: true } }, client: true },
        });
        if (!booking) {
            throw new NotFoundException('Reserva no encontrada.');
        }
        return booking;
    }

    async create(ownerId: string, data: { startTime: string; endTime: string; totalPrice: number; status: string; paymentMethod?: string; fieldId: string; clientId?: string | null }): Promise<Booking> {
        const field = await this.prisma.field.findUnique({
            where: { id: data.fieldId },
            include: { venue: true }
        });
        if (!field || field.deletedAt) {
            throw new NotFoundException('La cancha seleccionada no existe.');
        }

        const hasClientId = data.clientId && data.clientId !== '';

        if (hasClientId) {
            const client = await this.prisma.client.findFirst({
                where: { 
                    id: data.clientId!, 
                    venue: { ownerId },
                    deletedAt: null
                }
            });
            if (!client) {
                throw new NotFoundException('El cliente seleccionado no existe o no te pertenece.');
            }
        }

        // Collision check with deletedAt: null
        const existing = await this.prisma.booking.findFirst({
            where: {
                fieldId: data.fieldId,
                startTime: { lt: new Date(data.endTime) },
                endTime: { gt: new Date(data.startTime) },
                status: { in: ['CONFIRMED', 'PENDING'] },
                deletedAt: null,
            },
        });

        if (existing) {
            throw new ConflictException('Esta cancha ya está reservada para ese horario.');
        }

        return this.prisma.booking.create({
            data: {
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                totalPrice: data.totalPrice,
                status: data.status,
                paymentMethod: data.paymentMethod,
                field: { connect: { id: data.fieldId } },
                user: { connect: { id: ownerId } },
                ...(hasClientId ? { client: { connect: { id: data.clientId! } } } : {})
            }
        });
    }

    async update(id: string, ownerId: string, data: { startTime?: string; endTime?: string; totalPrice?: number; status?: string; paymentMethod?: string; fieldId?: string; clientId?: string | null }): Promise<Booking> {
        const existing = await this.prisma.booking.findFirst({
            where: {
                id,
                deletedAt: null,
                OR: [
                    { userId: ownerId },
                    { field: { venue: { ownerId } } }
                ]
            }
        });
        if (!existing) {
            throw new NotFoundException('Reserva no encontrada o no tienes permisos.');
        }

        if (data.fieldId && data.fieldId !== existing.fieldId) {
            const field = await this.prisma.field.findUnique({ 
                where: { id: data.fieldId } 
            });
            if (!field || field.deletedAt) {
                throw new NotFoundException('La cancha especificada no existe.');
            }
        }

        if (data.clientId !== undefined) {
            if (data.clientId && data.clientId !== '') {
                const client = await this.prisma.client.findFirst({ 
                    where: { 
                        id: data.clientId, 
                        venue: { ownerId },
                        deletedAt: null
                    } 
                });
                if (!client) {
                    throw new NotFoundException('El cliente especificado no te pertenece.');
                }
            }
        }

        return this.prisma.booking.update({
            where: { id },
            data: {
                ...(data.startTime ? { startTime: new Date(data.startTime) } : {}),
                ...(data.endTime ? { endTime: new Date(data.endTime) } : {}),
                ...(data.totalPrice !== undefined ? { totalPrice: data.totalPrice } : {}),
                ...(data.status ? { status: data.status } : {}),
                ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
                ...(data.fieldId ? { field: { connect: { id: data.fieldId } } } : {}),
                ...(data.clientId === null || data.clientId === ''
                    ? { client: { disconnect: true } }
                    : (data.clientId ? { client: { connect: { id: data.clientId } } } : {}))
            },
        });
    }

    async remove(id: string, ownerId: string): Promise<Booking> {
        const existing = await this.prisma.booking.findFirst({
            where: {
                id,
                deletedAt: null,
                OR: [
                    { userId: ownerId },
                    { field: { venue: { ownerId } } }
                ]
            }
        });
        if (!existing) {
            throw new NotFoundException('Reserva no encontrada o no tienes permisos.');
        }
        
        // Perform Soft Delete
        return this.prisma.booking.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
