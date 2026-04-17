import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Venue, Prisma } from '@prisma/client';

@Injectable()
export class VenuesService {
    constructor(private prisma: PrismaService) { }

    async findAll(ownerId: string): Promise<Venue[]> {
        return this.prisma.venue.findMany({
            where: { ownerId },
            include: { fields: true },
        });
    }

    async findOne(id: string): Promise<Venue | null> {
        return this.prisma.venue.findUnique({
            where: { id },
            include: { fields: true },
        });
    }

    async create(data: Prisma.VenueCreateInput): Promise<Venue> {
        return this.prisma.venue.create({ data });
    }

    async update(id: string, data: Prisma.VenueUpdateInput): Promise<Venue> {
        return this.prisma.venue.update({
            where: { id },
            data,
        });
    }

    async remove(id: string): Promise<Venue> {
        return this.prisma.venue.delete({
            where: { id },
        });
    }
}
