import { Body, Controller, Delete, Headers, Post, Req, UnauthorizedException, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private notificationsService: NotificationsService,
        private eventEmitter: EventEmitter2
    ) { }

    /** Register a browser push subscription */
    @Post('subscribe')
    @UseGuards(JwtAuthGuard)
    subscribe(
        @Req() req: any,
        @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
    ) {
        return this.notificationsService.subscribe(req.user.userId, body);
    }

    /** Remove a push subscription (user opt-out) */
    @Delete('subscribe')
    @UseGuards(JwtAuthGuard)
    unsubscribe(@Req() req: any, @Body() body: { endpoint: string }) {
        return this.notificationsService.unsubscribe(req.user.userId, body.endpoint);
    }

    /** Return the VAPID public key so the browser can subscribe */
    @Post('vapid-public-key')
    @UseGuards(JwtAuthGuard)
    getVapidKey() {
        return { publicKey: process.env.VAPID_PUBLIC_KEY };
    }

    /** Establish an SSE Connection for real-time notifications without polling */
    @Sse('stream')
    @UseGuards(JwtAuthGuard)
    stream(@Req() req: any): Observable<MessageEvent> {
        return fromEvent(this.eventEmitter, `notification.${req.user.userId}`).pipe(
            map((data) => ({ data } as MessageEvent)),
        );
    }

    /** Webhook for n8n to inject a notification to a specific user */
    @Post('inject')
    injectWebhook(
        @Headers('x-internal-token') token: string,
        @Body() body: { userId: string, title: string, content: string, url?: string },
    ) {
        const expectedToken = process.env.INTERNAL_API_TOKEN;
        if (!expectedToken || token !== expectedToken) {
            throw new UnauthorizedException('Invalid internal token');
        }

        return this.notificationsService.sendToUser(body.userId, {
            title: body.title,
            body: body.content,
            url: body.url
        });
    }
}
