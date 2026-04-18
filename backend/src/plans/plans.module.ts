import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [PlansService, PrismaService],
  controllers: [PlansController]
})
export class PlansModule { }
