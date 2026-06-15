import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VenuesModule } from './venues/venues.module';
import { FieldsModule } from './fields/fields.module';
import { BookingsModule } from './bookings/bookings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PrismaService } from './prisma.service';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TasksModule } from './tasks/tasks.module';
import { MercadoPagoModule } from './modules/mercadopago/mercadopago.module';
import { BillingModule } from './modules/billing/billing.module';
import { ClientsModule } from './clients/clients.module';
import { PlansModule } from './plans/plans.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiToolsModule } from './ai-tools/ai-tools.module';
import { QueuesModule } from './queues/queues.module';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AuthModule,
    UsersModule,
    VenuesModule,
    FieldsModule,
    BookingsModule,
    AnalyticsModule,
    TasksModule,
    BillingModule,
    MercadoPagoModule,
    ClientsModule,
    PlansModule,
    AuditModule,
    NotificationsModule,
    AiToolsModule,
    QueuesModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
