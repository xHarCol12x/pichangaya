import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('venues')
@UseGuards(JwtAuthGuard)
export class VenuesController {
    constructor(private readonly venuesService: VenuesService) { }

    @Get()
    findAll(@Request() req) {
        return this.venuesService.findAll(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.venuesService.findOne(id);
    }

    @Post()
    create(@Body() data: Prisma.VenueCreateInput) {
        return this.venuesService.create(data);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Prisma.VenueUpdateInput) {
        return this.venuesService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.venuesService.remove(id);
    }
}
