import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        private prisma: PrismaService,
        private audit: AuditService
    ) { }

    async activatePlanForTenant(tenantId: string, planCode: string, paymentData: { amount: number; transactionId: string; source: string; userId: string }) {
        this.logger.log(`Activando plan ${planCode} para tenant ${tenantId}`);

        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant no encontrado');

        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        return await this.prisma.$transaction(async (tx) => {
            // 1. Update Tenant status and current plan
            const updatedTenant = await tx.tenant.update({
                where: { id: tenantId },
                data: {
                    plan: planCode,
                    isActive: true,
                    subscriptionEndsAt: nextMonth
                }
            });

            // 2. Record the payment linked to the user who paid and potentially the tenant
            // Note: Currently Payment model is linked to User in schema.prisma
            await tx.payment.create({
                data: {
                    amount: paymentData.amount,
                    status: 'SUCCESS',
                    transactionId: paymentData.transactionId,
                    userId: paymentData.userId,
                    planCode: planCode
                }
            });

            // 3. Create a Subscription history record
            await tx.subscription.create({
                data: {
                    userId: paymentData.userId,
                    planCode: planCode,
                    startDate: new Date(),
                    endDate: nextMonth,
                    status: 'ACTIVE'
                }
            });

            // 4. Audit the activation
            await this.audit.log(
                'PLAN_ACTIVATED',
                paymentData.userId,
                'Tenant',
                tenantId,
                { planCode, transactionId: paymentData.transactionId, source: paymentData.source }
            );

            return updatedTenant;
        });
    }

    async getBillingHistory(tenantId: string) {
        return this.prisma.payment.findMany({
            where: { user: { memberships: { some: { tenantId } } } },
            orderBy: { createdAt: 'desc' }
        });
    }
}

