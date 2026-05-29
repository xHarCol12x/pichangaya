import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Venue } from '@prisma/client';

@Injectable()
export class VenuesService {
    constructor(private prisma: PrismaService) { }

    async findAll(ownerId: string): Promise<Venue[]> {
        return this.prisma.venue.findMany({
            where: { ownerId, deletedAt: null },
            include: { fields: { where: { deletedAt: null } } },
        });
    }

    async findOne(id: string, ownerId: string): Promise<Venue | null> {
        const venue = await this.prisma.venue.findFirst({
            where: { id, ownerId, deletedAt: null },
            include: { fields: { where: { deletedAt: null } } },
        });
        if (!venue) {
            throw new NotFoundException('Sede no encontrada.');
        }
        return venue;
    }

    async create(ownerId: string, data: { name: string; address: string; description?: string }): Promise<Venue> {
        // 1. Get user and their plan
        const user = await this.prisma.user.findUnique({
            where: { id: ownerId },
            select: { plan: true }
        });

        if (!user) throw new NotFoundException('Usuario no encontrado');

        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { code: user.plan }
        });

        if (!plan) throw new ForbiddenException('Plan de suscripción no válido');

        // 2. Count current active venues
        const currentVenuesCount = await this.prisma.venue.count({
            where: { ownerId, deletedAt: null }
        });

        // 3. Validate limit
        if (currentVenuesCount >= plan.limitVenues) {
            throw new ForbiddenException(
                `Has alcanzado el límite de sedes (${plan.limitVenues}) para tu plan ${plan.name}. Mejora tu suscripción.`
            );
        }

        return this.prisma.venue.create({
            data: {
                ...data,
                owner: { connect: { id: ownerId } }
            }
        });
    }

    async update(id: string, ownerId: string, data: { name?: string; address?: string; description?: string }): Promise<Venue> {
        const existing = await this.prisma.venue.findFirst({ where: { id, ownerId, deletedAt: null } });
        if (!existing) {
            throw new NotFoundException('Sede no encontrada o no tienes permisos.');
        }
        return this.prisma.venue.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, ownerId: string): Promise<Venue> {
        const existing = await this.prisma.venue.findFirst({ where: { id, ownerId, deletedAt: null } });
        if (!existing) {
            throw new NotFoundException('Sede no encontrada o no tienes permisos.');
        }
        
        // Soft delete
        return this.prisma.venue.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
