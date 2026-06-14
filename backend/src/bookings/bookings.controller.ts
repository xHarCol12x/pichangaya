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
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(@Request() req) {
    return this.bookingsService.findAllForTenant(req.user.tenantId);
  }

  @Get('my')
  findMyBookings(@Request() req) {
    return this.bookingsService.findByUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.bookingsService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    return this.bookingsService.create(
      req.user.userId,
      req.user.tenantId,
      createBookingDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req,
  ) {
    return this.bookingsService.update(id, req.user.tenantId, updateBookingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.bookingsService.remove(id, req.user.tenantId);
  }
}
