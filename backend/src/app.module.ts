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
import { TasksService } from './tasks/tasks.service';
import { TasksModule } from './tasks/tasks.module';
import { MercadoPagoModule } from './modules/mercadopago/mercadopago.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    VenuesModule,
    FieldsModule,
    BookingsModule,
    AnalyticsModule,
    TasksModule,
    MercadoPagoModule,
    ClientsModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, TasksService],
})
export class AppModule { }
