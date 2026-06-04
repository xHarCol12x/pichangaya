import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      } as any,
    }) as unknown as Promise<User[]>;
  }

  async findMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        subscriptionEndsAt: true,
        featureOverrides: true,
        plan: true,
      },
    });
    if (!user) return null;

    let isActuallyActive = user.isActive;
    if (isActuallyActive && user.subscriptionEndsAt) {
      const now = new Date();
      if (new Date(user.subscriptionEndsAt) <= now) {
        isActuallyActive = false;
      }
    }

    let planDetails: any = null;
    try {
      if (user.plan) {
        const planObj = await this.prisma.subscriptionPlan.findUnique({
          where: { code: user.plan },
        });
        if (planObj) {
          planDetails = {
            code: planObj.code,
            name: planObj.name,
            limitVenues: planObj.limitVenues,
            limitFields: planObj.limitFields,
            permissions: planObj.permissions,
          };
        }
      }
    } catch (e) {
      console.error(
        '[STABILITY-LOG] Error fetching plan details in findMe:',
        e,
      );
    }

    // Parse featureOverrides if it's a string
    let overrides = user.featureOverrides || {};
    if (typeof overrides === 'string') {
      try {
        overrides = JSON.parse(overrides);
      } catch (e) {
        overrides = {};
      }
    }

    return {
      ...user,
      isActive: isActuallyActive,
      featureOverrides: overrides,
      planDetails,
    };
  }

  async findTenants() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        plan: true,
        subscriptionEndsAt: true,
        createdAt: true,
        featureOverrides: true,
        _count: { select: { venues: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTenantById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        plan: true,
        subscriptionEndsAt: true,
        createdAt: true,
        updatedAt: true,
        venues: {
          select: {
            id: true,
            name: true,
            address: true,
            _count: { select: { fields: true } },
          },
        },
        bookings: {
          select: {
            id: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            venues: true,
            bookings: true,
          },
        },
      },
    });
  }

  async updateTenantSubscription(
    id: string,
    data: {
      plan?: string;
      isActive?: boolean;
      subscriptionEndsAt?: string | null;
      extendDays?: number;
      featureOverrides?: any;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Tenant not found');

    const updateData: any = {};

    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.featureOverrides !== undefined)
      updateData.featureOverrides = data.featureOverrides;

    if (data.subscriptionEndsAt !== undefined) {
      updateData.subscriptionEndsAt = data.subscriptionEndsAt
        ? new Date(data.subscriptionEndsAt)
        : null;
    }

    if (data.extendDays && data.extendDays > 0) {
      const base =
        user.subscriptionEndsAt && user.subscriptionEndsAt > new Date()
          ? user.subscriptionEndsAt
          : new Date();
      const extended = new Date(base);
      extended.setDate(extended.getDate() + data.extendDays);
      updateData.subscriptionEndsAt = extended;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        plan: true,
        subscriptionEndsAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateMySettings(id: string, data: { featureOverrides?: any }) {
    return this.prisma.user.update({
      where: { id },
      data: { featureOverrides: data.featureOverrides },
      select: {
        id: true,
        featureOverrides: true,
        updatedAt: true,
      },
    });
  }
}
