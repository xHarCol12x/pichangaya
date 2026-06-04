import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mpService: MercadoPagoService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-preference')
  async createPreference(
    @Req() req,
    @Body('planName') planName: string,
    @Body('price') price: number,
  ) {
    return this.mpService.createPreference(req.user.userId, planName, price);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-subscription')
  async createSubscription(
    @Req() req,
    @Body('planName') planName: string,
    @Body('price') price: number,
  ) {
    return this.mpService.createSubscription(req.user.userId, planName, price);
  }

  @Post('webhook')
  async handleWebhook(@Body() data: any) {
    return this.mpService.handleWebhook(data);
  }
}
