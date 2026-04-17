import { Module } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { MercadoPagoController } from './mercadopago.controller';
import { PrismaService } from '../../prisma.service';

@Module({
    providers: [MercadoPagoService, PrismaService],
    controllers: [MercadoPagoController],
    exports: [MercadoPagoService],
})
export class MercadoPagoModule { }
