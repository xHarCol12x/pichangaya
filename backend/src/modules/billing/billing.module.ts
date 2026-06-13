import { Module, Global } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PrismaService } from '../../prisma.service';

@Global()
@Module({
    providers: [BillingService, PrismaService],
    exports: [BillingService],
})
export class BillingModule { }
