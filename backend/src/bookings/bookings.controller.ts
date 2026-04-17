import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Get()
    findAll(@Request() req) {
        return this.bookingsService.findAllForOwner(req.user.userId);
    }

    @Get('my')
    findMyBookings(@Request() req) {
        return this.bookingsService.findByUser(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }

    @Post()
    create(@Body() data: Prisma.BookingCreateInput, @Request() req) {
        // Ensure the booking is for the logged in user if they are not admin
        // This is a simplified version
        return this.bookingsService.create({
            ...data,
            user: { connect: { id: req.user.userId } }
        });
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Prisma.BookingUpdateInput) {
        return this.bookingsService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.bookingsService.remove(id);
    }
}
