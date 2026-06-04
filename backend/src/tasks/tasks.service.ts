import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(private prisma: PrismaService) { }

    // Run every midnight
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleSubscriptionExpiration() {
        this.logger.debug('Running daily subscription check...');

        const now = new Date();

        // Find all users who are active but their subscription has ended
        const expiredUsers = await this.prisma.user.findMany({
            where: {
                isActive: true,
                subscriptionEndsAt: {
                    lt: now, // Less than current date
                },
                role: 'ADMIN', // Only affect Tenants
            },
        });

        if (expiredUsers.length > 0) {
            const expiredUserIds = expiredUsers.map(user => user.id);

            // Bulk update users to inactive
            await this.prisma.user.updateMany({
                where: {
                    id: {
                        in: expiredUserIds,
                    },
                },
                data: { isActive: false },
            });

            // Bulk create audit logs
            const auditLogs = expiredUserIds.map(userId => ({
                event: 'SUBSCRIPTION_EXPIRED_AUTO',
                userId: userId,
                metadata: { reason: 'Cron job detected past due date' },
            }));

            await this.prisma.analyticsLog.createMany({
                data: auditLogs,
            });

            // Bulk log for visibility without I/O bottleneck
            const deactivatedEmails = expiredUsers.map(user => user.email).join(', ');
            this.logger.log(`Deactivated expired accounts for Tenants: ${deactivatedEmails}`);
        }

        this.logger.debug(`Subscription check finished. Deactivated ${expiredUsers.length} accounts.`);
    }

    this.logger.debug(
      `Subscription check finished. Deactivated ${expiredUsers.length} accounts.`,
    );
  }
}
