import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AnalyticsService {
    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
    ) { }

    async getDashboardStats() {
        const totalRevenue = await this.prisma.payment.aggregate({
            where: { status: 'SUCCESS' },
            _sum: { amount: true },
        });

        const totalBookings = await this.prisma.booking.count();
        const totalUsers = await this.prisma.user.count();

        // Mock occupancy rate for the dashboard
        const occupancyRate = 0.74;

        return {
            revenue: totalRevenue._sum.amount || 0,
            bookings: totalBookings,
            users: totalUsers,
            occupancy: occupancyRate,
        };
    }

    async getAiPrediction() {
        // Fetch last 14 days of booking data
        const bookings = await this.prisma.booking.findMany({
            orderBy: { startTime: 'asc' },
            take: 50, // Simplified for demo
        });

        // Group bookings by date
        const groupedData = bookings.reduce((acc, curr) => {
            const date = curr.startTime.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        const historicalData = Object.entries(groupedData).map(([date, count]) => ({
            date,
            bookings: count,
        }));

        try {
            const response = await firstValueFrom(
                this.httpService.post('http://ai-service:8000/predict', {
                    historical_data: historicalData,
                }),
            );
            return response.data;
        } catch (error) {
            // Fallback mock if AI service is not reachable
            return {
                prediction: 0.85,
                trend: 'up',
                status: 'fallback'
            };
        }
    }
}
