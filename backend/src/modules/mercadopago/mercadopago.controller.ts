import { Controller, Post, Body, Req, UseGuards, Get, Query } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('mercadopago')
export class MercadoPagoController {
    constructor(private readonly mpService: MercadoPagoService) { }

    @UseGuards(JwtAuthGuard)
    @Post('create-preference')
    async createPreference(
        @Req() req, 
        @Body('planCode') planCode: string, 
        @Body('interval') interval: 'mensual' | 'anual'
    ) {
        return this.mpService.createPreference(req.user.userId, planCode, interval);
    }

    @UseGuards(JwtAuthGuard)
    @Post('create-subscription')
    async createSubscription(@Req() req, @Body('planCode') planCode: string) {
        return this.mpService.createSubscription(req.user.userId, planCode);
    }

    @Post('webhook')
    async handleWebhook(@Body() data: any, @Req() req: any) {
        return this.mpService.handleWebhook(data, req.headers);
    }
}
