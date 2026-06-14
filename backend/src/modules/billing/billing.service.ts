import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async activatePlan(
    userId: string,
    planCode: string,
    paymentData: { amount: number; transactionId: string; source: string },
  ) {
    this.logger.log(`Activando plan ${planCode} para usuario ${userId}`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const now = new Date();
    const nextMonth = new Date(now.setMonth(now.getMonth() + 1));

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update User status and current plan
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          plan: planCode,
          isActive: true,
          subscriptionEndsAt: nextMonth,
        },
      });

      // 2. Record the payment
      await tx.payment.create({
        data: {
          amount: paymentData.amount,
          status: 'APPROVED',
          transactionId: paymentData.transactionId,
          userId: userId,
          planCode: planCode,
        },
      });

      // 3. Create a Subscription history record
      await tx.subscription.create({
        data: {
          userId: userId,
          planCode: planCode,
          startDate: new Date(),
          endDate: nextMonth,
          status: 'ACTIVE',
        },
      });

      // 4. Audit the activation
      await this.audit.log('PLAN_ACTIVATED', userId, 'User', userId, {
        planCode,
        transactionId: paymentData.transactionId,
        source: paymentData.source,
      });

      return updatedUser;
    });
  }

  async getBillingHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }
}
