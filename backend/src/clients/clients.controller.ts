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
  Query,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@Request() req, @Query('venueId') venueId?: string) {
    if (venueId) {
      return this.clientsService.findByVenue(venueId, req.user.userId);
    }
    return this.clientsService.findByOwner(req.user.userId);
  }

  @Post()
  create(@Body() createClientDto: CreateClientDto, @Request() req) {
    return this.clientsService.create(req.user.userId, createClientDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req,
  ) {
    return this.clientsService.update(id, req.user.userId, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.clientsService.remove(id, req.user.userId);
  }
}
