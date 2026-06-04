import { Module } from '@nestjs/common';
import { FieldsService } from './fields.service';
import { FieldsController } from './fields.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [FieldsController],
  providers: [FieldsService, PrismaService],
  exports: [FieldsService],
})
export class FieldsModule {}
