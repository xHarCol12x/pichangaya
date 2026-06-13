import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { FieldsService } from './fields.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';

@Controller('fields')
@UseGuards(JwtAuthGuard)
export class FieldsController {
    constructor(private readonly fieldsService: FieldsService) { }

    @Get()
    findAll(@Request() req, @Query('venueId') venueId?: string) {
        if (venueId) {
            return this.fieldsService.findByVenue(venueId, req.user.tenantId);
        }
        return this.fieldsService.findAllByTenant(req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.fieldsService.findOne(id, req.user.tenantId);
    }

    @Post()
    create(@Body() createFieldDto: CreateFieldDto, @Request() req) {
        return this.fieldsService.create(req.user.tenantId, createFieldDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateFieldDto: UpdateFieldDto, @Request() req) {
        return this.fieldsService.update(id, req.user.tenantId, updateFieldDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.fieldsService.remove(id, req.user.tenantId);
    }
}

