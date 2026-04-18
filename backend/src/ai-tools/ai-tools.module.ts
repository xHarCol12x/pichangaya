import { Module } from '@nestjs/common';
import { AiToolsController } from './ai-tools.controller';
import { AiToolsService } from './ai-tools.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AiToolsController],
  providers: [AiToolsService, PrismaService]
})
export class AiToolsModule { }
