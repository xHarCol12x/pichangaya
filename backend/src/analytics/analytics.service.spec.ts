import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('AnalyticsService', () => {
    let service: AnalyticsService;
    let prismaService: PrismaService;
    let httpService: HttpService;

    const mockPrismaService = {
        payment: {
            aggregate: jest.fn(),
        },
        booking: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        user: {
            count: jest.fn(),
        },
    };

    const mockHttpService = {
        post: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: HttpService,
                    useValue: mockHttpService,
                },
            ],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);
        prismaService = module.get<PrismaService>(PrismaService);
        httpService = module.get<HttpService>(HttpService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDashboardStats', () => {
        it('should return dashboard statistics correctly', async () => {
            mockPrismaService.payment.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
            mockPrismaService.booking.count.mockResolvedValue(50);
            mockPrismaService.user.count.mockResolvedValue(100);

            const result = await service.getDashboardStats();

            expect(mockPrismaService.payment.aggregate).toHaveBeenCalledWith({
                where: { status: 'SUCCESS' },
                _sum: { amount: true },
            });
            expect(mockPrismaService.booking.count).toHaveBeenCalled();
            expect(mockPrismaService.user.count).toHaveBeenCalled();

            expect(result).toEqual({
                revenue: 1000,
                bookings: 50,
                users: 100,
                occupancy: 0.74,
            });
        });

        it('should handle missing revenue (null)', async () => {
            mockPrismaService.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
            mockPrismaService.booking.count.mockResolvedValue(0);
            mockPrismaService.user.count.mockResolvedValue(0);

            const result = await service.getDashboardStats();

            expect(result).toEqual({
                revenue: 0,
                bookings: 0,
                users: 0,
                occupancy: 0.74,
            });
        });
    });

    describe('getAiPrediction', () => {
        it('should return prediction data from AI service successfully', async () => {
            const mockBookings = [
                { startTime: new Date('2023-10-01T10:00:00Z') },
                { startTime: new Date('2023-10-01T14:00:00Z') },
                { startTime: new Date('2023-10-02T10:00:00Z') },
            ];
            mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);

            const mockResponse: AxiosResponse = {
                data: { prediction: 0.9, trend: 'up' },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: { headers: {} as any },
            };
            mockHttpService.post.mockReturnValue(of(mockResponse));

            const result = await service.getAiPrediction();

            expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
                orderBy: { startTime: 'asc' },
                take: 50,
            });

            expect(mockHttpService.post).toHaveBeenCalledWith('http://ai-service:8000/predict', {
                historical_data: [
                    { date: '2023-10-01', bookings: 2 },
                    { date: '2023-10-02', bookings: 1 },
                ],
            });

            expect(result).toEqual({ prediction: 0.9, trend: 'up' });
        });

        it('should return fallback data if AI service fails', async () => {
            mockPrismaService.booking.findMany.mockResolvedValue([]);
            mockHttpService.post.mockReturnValue(throwError(() => new Error('Service Unavailable')));

            const result = await service.getAiPrediction();

            expect(result).toEqual({
                prediction: 0.85,
                trend: 'up',
                status: 'fallback',
            });
        });
    });
});
