import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Get()
    findAll(@Request() req, @Query('venueId') venueId?: string) {
        if (venueId) {
            return this.clientsService.findByVenue(venueId);
        }
        return this.clientsService.findByOwner(req.user.userId);
    }

    @Post()
    create(@Body() body: { name: string; phone: string; email?: string; notes?: string; venueId: string }) {
        return this.clientsService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: { name?: string; phone?: string; email?: string; notes?: string }) {
        return this.clientsService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.clientsService.remove(id);
    }
}
