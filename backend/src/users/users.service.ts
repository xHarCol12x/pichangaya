import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

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
            } as any
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
                themePreference: true,
                memberships: {
                    include: {
                        tenant: true
                    }
                }
            }
        });
        if (!user) return null;

        const isActuallyActive = this.calculateEffectiveStatus(user);
        const planPermissions = await this.resolvePlanPermissions(user.plan);

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
            planPermissions,
            tenants: user.memberships.map(m => ({
                id: m.tenantId,
                name: m.tenant.name,
                role: m.role,
                isActive: m.tenant.isActive,
                plan: m.tenant.plan
            }))
        };
    }

    /**
     * Centralized logic to determine if a user is active based on isActive flag and subscription date.
     */
    calculateEffectiveStatus(user: { isActive: boolean; subscriptionEndsAt: Date | null }): boolean {
        if (!user.isActive) return false;
        if (user.subscriptionEndsAt) {
            const now = new Date();
            if (new Date(user.subscriptionEndsAt) <= now) {
                return false;
            }
        }
        return true;
    }

    /**
     * Resolves permissions for a given plan code.
     */
    async resolvePlanPermissions(planCode: string | null): Promise<any> {
        if (!planCode) return {};
        try {
            const planObj = await this.prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
            return planObj?.permissions || {};
        } catch (e) {
            console.error('[STABILITY-LOG] Error fetching plan permissions:', e);
            return {};
        }
    }

    async findTenants() {
        return this.prisma.tenant.findMany({
            include: {
                _count: { select: { venues: true, members: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findTenantById(id: string) {
        return this.prisma.tenant.findUnique({
            where: { id },
            include: {
                venues: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        _count: { select: { fields: true } }
                    }
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, name: true, role: true }
                        }
                    }
                },
                _count: {
                    select: {
                        venues: true,
                        members: true,
                    }
                }
            }
        });
    }

    async updateTenantSubscription(id: string, data: {
        plan?: string;
        isActive?: boolean;
        subscriptionEndsAt?: string | null;
        extendDays?: number;
    }) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) throw new Error('Tenant not found');

        const updateData: any = {};

        if (data.plan !== undefined) updateData.plan = data.plan;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        if (data.subscriptionEndsAt !== undefined) {
            updateData.subscriptionEndsAt = data.subscriptionEndsAt
                ? new Date(data.subscriptionEndsAt)
                : null;
        }

        if (data.extendDays && data.extendDays > 0) {
            const base = tenant.subscriptionEndsAt && tenant.subscriptionEndsAt > new Date()
                ? tenant.subscriptionEndsAt
                : new Date();
            const extended = new Date(base);
            extended.setDate(extended.getDate() + data.extendDays);
            updateData.subscriptionEndsAt = extended;
        }

        return this.prisma.tenant.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                isActive: true,
                plan: true,
                subscriptionEndsAt: true,
                updatedAt: true,
            }
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

    async updateMySettings(id: string, data: { featureOverrides?: any; themePreference?: string }) {
        const updateData: Prisma.UserUpdateInput = {};

        if (data.featureOverrides !== undefined) {
            updateData.featureOverrides = data.featureOverrides;
        }

        if (data.themePreference !== undefined) {
            updateData.themePreference = data.themePreference;
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                featureOverrides: true,
                themePreference: true,
                updatedAt: true,
            }
        });
    }
}
