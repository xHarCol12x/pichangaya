import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AiToolsService {
    constructor(private prisma: PrismaService) { }

    async getAvailability(date: string, venueId: string) {
        if (!date || !venueId) throw new BadRequestException("date and venueId are required");

        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        const fields = await this.prisma.field.findMany({ where: { venueId } });
        const bookings = await this.prisma.booking.findMany({
            where: {
                field: { venueId },
                startTime: { gte: startOfDay, lt: endOfDay },
                status: { not: 'CANCELLED' }
            }
        });

        const summary = fields.map(f => {
            const fieldBookings = bookings.filter(b => b.fieldId === f.id);
            return {
                id: f.id,
                name: f.name,
                type: f.type,
                pricePerHour: f.pricePerHour,
                ocupado_en_estos_horarios: fieldBookings.map(b => ({
                    desde: b.startTime.toISOString(),
                    hasta: b.endTime.toISOString()
                }))
            };
        });

        return {
            fecha: date,
            instruccion_para_ia: "Revisa las horas ocupadas. Si la hora pedida por el cliente NO está ocupada, significa que está libre y puedes ofrecerla. Devuelve el id de la cancha al reservar.",
            canchas: summary
        };
    }

    async getPrice(fieldId: string, hours: number) {
        const field = await this.prisma.field.findUnique({ where: { id: fieldId } });
        if (!field) throw new BadRequestException("Field not found");
        return {
            fieldId,
            precio_total: field.pricePerHour * hours,
            moneda: "PEN"
        };
    }

    async createBooking(data: { venueId: string, customerName: string, customerPhone: string, fieldId: string, startTime: string, endTime: string }) {
        const { venueId, customerName, customerPhone, fieldId, startTime, endTime } = data;
        const sTime = new Date(startTime);
        const eTime = new Date(endTime);

        // Find Venue Owner (userId)
        const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
        if (!venue) throw new BadRequestException("Venue not found");

        // Find or create Client
        let client = await this.prisma.client.findFirst({ where: { phone: customerPhone, venueId } });
        if (!client) {
            client = await this.prisma.client.create({
                data: {
                    name: customerName,
                    phone: customerPhone,
                    venueId: venueId
                }
            });
        }

        const field = await this.prisma.field.findUnique({ where: { id: fieldId } });
        if (!field) throw new BadRequestException("Field not found");

        const hours = (eTime.getTime() - sTime.getTime()) / 3600000;
        const price = field.pricePerHour * hours;

        const booking = await this.prisma.booking.create({
            data: {
                startTime: sTime,
                endTime: eTime,
                totalPrice: price,
                status: 'PENDING',
                fieldId: field.id,
                userId: venue.ownerId,
                clientId: client.id
            }
        });

        return {
            success: true,
            bookingId: booking.id,
            mensaje_para_ia: "Reserva creada con éxito. Informa al cliente que el total es " + price + " y pásale el link de pago.",
            link_pago: `https://pichangalibre.xyz/pagar/${booking.id}`
        };
    }
}
