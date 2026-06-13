import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as webpush from 'web-push';
import { EventEmitter2 } from '@nestjs/event-emitter';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const isWebPushConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (isWebPushConfigured) {
    webpush.setVapidDetails(
        'mailto:admin@pichangalibre.xyz',
        vapidPublicKey!,
        vapidPrivateKey!,
    );
}

@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2
    ) { }

    /** Store or update a push subscription for a user */
    async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
        return this.prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
            create: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });
    }

    /** Remove a subscription (user unsubscribed) */
    async unsubscribe(userId: string, endpoint: string) {
        return this.prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
    }

    /** Send a push notification to all subscriptions of a user */
    async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
        // 1. Emit SSE for users actively connected to the dashboard
        this.eventEmitter.emit(`notification.${userId}`, payload);

        // 2. Send Background Web Push Notification
        if (!isWebPushConfigured) return [];

        const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
        if (subs.length === 0) return [];

        const message = JSON.stringify(payload);
        const results = await Promise.allSettled(
            subs.map(sub =>
                webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    message,
                ).catch(async (err) => {
                    // Remove expired/invalid subscriptions (status 410 = Gone)
                    if (err.statusCode === 410) {
                        await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
                    }
                    throw err;
                }),
            ),
        );
        return results;
    }

    /** Broadcast a push to ALL subscriptions of users who are OWNERS/ADMINS of a given tenant */
    async notifyTenantAdmins(tenantId: string, payload: { title: string; body: string; url?: string }) {
        const members = await this.prisma.tenantMembership.findMany({
            where: { tenantId, role: { in: ['OWNER', 'ADMIN'] } },
            select: { userId: true }
        });

        const results = await Promise.all(
            members.map(member => this.sendToUser(member.userId, payload))
        );
        return results.flat();
    }
}

