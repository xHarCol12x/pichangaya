import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Controller('venues')
@UseGuards(JwtAuthGuard)
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  findAll(@Request() req) {
    return this.venuesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.venuesService.findOne(id, req.user.userId);
  }

  @Post()
  create(@Body() createVenueDto: CreateVenueDto, @Request() req) {
    return this.venuesService.create(req.user.userId, createVenueDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
    @Request() req,
  ) {
    return this.venuesService.update(id, req.user.userId, updateVenueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.venuesService.remove(id, req.user.userId);
  }
}
