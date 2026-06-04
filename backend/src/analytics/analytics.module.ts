import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService],
})
export class AnalyticsModule {}
