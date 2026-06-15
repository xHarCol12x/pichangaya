import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email-queue',
        }),
        EmailModule,
    ],
    providers: [EmailProcessor],
    exports: [BullModule],
})
export class QueuesModule { }
