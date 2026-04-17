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

        for (const user of expiredUsers) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isActive: false },
            });

            // Audit Trail
            await this.prisma.analyticsLog.create({
                data: {
                    event: 'SUBSCRIPTION_EXPIRED_AUTO',
                    userId: user.id,
                    metadata: { reason: 'Cron job detected past due date' },
                },
            });

            this.logger.log(`Deactivated expired account for Tenant: ${user.email}`);
        }

        this.logger.debug(`Subscription check finished. Deactivated ${expiredUsers.length} accounts.`);
    }
}

