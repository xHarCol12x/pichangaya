import { Controller, Get, Post, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service';
import * as crypto from 'crypto';

@Controller('ai-tools')
export class AiToolsController {
    constructor(private aiToolsService: AiToolsService) { }

    private checkAuth(token: string) {
        const expectedToken = process.env.AI_SERVICE_TOKEN;
        if (!expectedToken || !token) {
            throw new UnauthorizedException('Invalid AI Token');
        }

        const tokenBuffer = Buffer.from(token);
        const expectedTokenBuffer = Buffer.from(expectedToken);

        if (tokenBuffer.length !== expectedTokenBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedTokenBuffer)) {
            throw new UnauthorizedException('Invalid AI Token');
        }
    }

    @Get('availability')
    getAvailability(
        @Headers('x-ai-token') token: string,
        @Query('date') date: string,
        @Query('venueId') venueId: string
    ) {
        this.checkAuth(token);
        return this.aiToolsService.getAvailability(date, venueId);
    }

    @Get('price')
    getPrice(
        @Headers('x-ai-token') token: string,
        @Query('fieldId') fieldId: string,
        @Query('hours') hours: string
    ) {
        this.checkAuth(token);
        return this.aiToolsService.getPrice(fieldId, parseFloat(hours));
    }

    @Post('book')
    createBooking(
        @Headers('x-ai-token') token: string,
        @Body() body: any
    ) {
        this.checkAuth(token);
        return this.aiToolsService.createBooking(body);
    }
}
