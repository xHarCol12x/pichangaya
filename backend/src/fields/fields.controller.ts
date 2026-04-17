import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { FieldsService } from './fields.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fields')
@UseGuards(JwtAuthGuard)
export class FieldsController {
    constructor(private readonly fieldsService: FieldsService) { }

    @Get()
    findAll(@Request() req, @Query('venueId') venueId?: string) {
        if (venueId) {
            // Further optimization: Validate that venueId belongs to req.user.userId
            return this.fieldsService.findByVenue(venueId);
        }
        return this.fieldsService.findAllByOwner(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.fieldsService.findOne(id);
    }

    @Post()
    create(@Body() data: Prisma.FieldCreateInput) {
        return this.fieldsService.create(data);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Prisma.FieldUpdateInput) {
        return this.fieldsService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.fieldsService.remove(id);
    }
}
