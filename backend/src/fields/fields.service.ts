import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Field, Prisma } from '@prisma/client';

@Injectable()
export class FieldsService {
    constructor(private prisma: PrismaService) { }

    async findAllByOwner(ownerId: string): Promise<Field[]> {
        return this.prisma.field.findMany({
            where: { venue: { ownerId } },
            include: { venue: true },
        });
    }

    async findByVenue(venueId: string): Promise<Field[]> {
        return this.prisma.field.findMany({
            where: { venueId },
        });
    }

    async findOne(id: string): Promise<Field | null> {
        return this.prisma.field.findUnique({
            where: { id },
            include: { venue: true },
        });
    }

    async create(data: Prisma.FieldCreateInput): Promise<Field> {
        return this.prisma.field.create({ data });
    }

    async update(id: string, data: Prisma.FieldUpdateInput): Promise<Field> {
        return this.prisma.field.update({
            where: { id },
            data,
        });
    }

    async remove(id: string): Promise<Field> {
        return this.prisma.field.delete({
            where: { id },
        });
    }
}
