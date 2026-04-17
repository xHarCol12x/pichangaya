import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma.service';

@Module({
    providers: [TasksService, PrismaService],
})
export class TasksModule { }
