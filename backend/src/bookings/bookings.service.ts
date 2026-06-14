import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Booking, Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAllForTenant(tenantId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        field: { venue: { tenantId } },
        deletedAt: null,
      },
      include: {
        user: true,
        field: { include: { venue: true } },
        client: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByUser(userId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: { field: { include: { venue: true } } },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Booking | null> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id,
        deletedAt: null,
        field: { venue: { tenantId } },
      },
      include: {
        user: true,
        field: { include: { venue: true } },
        client: true,
      },
    });
    if (!booking) {
      throw new NotFoundException('Reserva no encontrada.');
    }
    return booking;
  }

  async create(
    userId: string,
    tenantId: string,
    data: {
      startTime: string;
      endTime: string;
      totalPrice: number;
      status: string;
      paymentMethod?: string;
      fieldId: string;
      clientId?: string | null;
    },
  ): Promise<Booking> {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio.',
      );
    }

    const field = await this.prisma.field.findFirst({
      where: {
        id: data.fieldId,
        deletedAt: null,
        venue: { tenantId, deletedAt: null },
      },
    });
    if (!field) {
      throw new NotFoundException(
        'La cancha seleccionada no existe o no pertenece a tu organización.',
      );
    }

    const hasClientId = data.clientId && data.clientId !== '';

    if (hasClientId) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: data.clientId!,
          venue: { tenantId },
          deletedAt: null,
        },
      });
      if (!client) {
        throw new NotFoundException(
          'El cliente seleccionado no existe o no pertenece a tu organización.',
        );
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.booking.findFirst({
          where: {
            fieldId: data.fieldId,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
            status: { in: ['CONFIRMED', 'PENDING'] },
            deletedAt: null,
          },
        });

        if (existing) {
          throw new ConflictException(
            'Esta cancha ya esta reservada para ese horario.',
          );
        }

        return tx.booking.create({
          data: {
            startTime,
            endTime,
            totalPrice: data.totalPrice,
            status: data.status,
            paymentMethod: data.paymentMethod,
            field: { connect: { id: data.fieldId } },
            user: { connect: { id: userId } },
            ...(hasClientId
              ? { client: { connect: { id: data.clientId! } } }
              : {}),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async update(
    id: string,
    tenantId: string,
    data: {
      startTime?: string;
      endTime?: string;
      totalPrice?: number;
      status?: string;
      paymentMethod?: string;
      fieldId?: string;
      clientId?: string | null;
    },
  ): Promise<Booking> {
    const existing = await this.prisma.booking.findFirst({
      where: {
        id,
        deletedAt: null,
        field: { venue: { tenantId } },
      },
    });
    if (!existing) {
      throw new NotFoundException(
        'Reserva no encontrada o no tienes permisos.',
      );
    }

    if (data.fieldId && data.fieldId !== existing.fieldId) {
      const field = await this.prisma.field.findFirst({
        where: {
          id: data.fieldId,
          deletedAt: null,
          venue: { tenantId, deletedAt: null },
        },
      });
      if (!field) {
        throw new NotFoundException(
          'La cancha especificada no existe o no pertenece a tu organización.',
        );
      }
    }

    if (data.clientId !== undefined) {
      if (data.clientId && data.clientId !== '') {
        const client = await this.prisma.client.findFirst({
          where: {
            id: data.clientId,
            venue: { tenantId },
            deletedAt: null,
          },
        });
        if (!client) {
          throw new NotFoundException(
            'El cliente especificado no pertenece a tu organización.',
          );
        }
      }
    }

    const nextFieldId = data.fieldId || existing.fieldId;
    const nextStartTime = data.startTime
      ? new Date(data.startTime)
      : existing.startTime;
    const nextEndTime = data.endTime
      ? new Date(data.endTime)
      : existing.endTime;

    if (nextEndTime <= nextStartTime) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const collision = await tx.booking.findFirst({
          where: {
            id: { not: id },
            fieldId: nextFieldId,
            startTime: { lt: nextEndTime },
            endTime: { gt: nextStartTime },
            status: { in: ['CONFIRMED', 'PENDING'] },
            deletedAt: null,
          },
        });

        if (collision) {
          throw new ConflictException(
            'Esta cancha ya esta reservada para ese horario.',
          );
        }

        return tx.booking.update({
          where: { id },
          data: {
            ...(data.startTime ? { startTime: nextStartTime } : {}),
            ...(data.endTime ? { endTime: nextEndTime } : {}),
            ...(data.totalPrice !== undefined
              ? { totalPrice: data.totalPrice }
              : {}),
            ...(data.status ? { status: data.status } : {}),
            ...(data.paymentMethod
              ? { paymentMethod: data.paymentMethod }
              : {}),
            ...(data.fieldId
              ? { field: { connect: { id: data.fieldId } } }
              : {}),
            ...(data.clientId === null || data.clientId === ''
              ? { client: { disconnect: true } }
              : data.clientId
                ? { client: { connect: { id: data.clientId } } }
                : {}),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async remove(id: string, tenantId: string): Promise<Booking> {
    const existing = await this.prisma.booking.findFirst({
      where: {
        id,
        deletedAt: null,
        field: { venue: { tenantId } },
      },
    });
    if (!existing) {
      throw new NotFoundException(
        'Reserva no encontrada o no tienes permisos.',
      );
    }

    // Perform Soft Delete
    return this.prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
