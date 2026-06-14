import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    booking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    field: {
      findFirst: jest.fn(),
    },
    client: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'user-1';
    const tenantId = 'tenant-1';
    const bookingData = {
      startTime: '2026-06-12T10:00:00Z',
      endTime: '2026-06-12T11:00:00Z',
      totalPrice: 50,
      status: 'CONFIRMED',
      fieldId: 'field-1',
    };

    it('should throw BadRequestException if endTime is before startTime', async () => {
      const invalidData = { ...bookingData, endTime: '2026-06-12T09:00:00Z' };
      await expect(
        service.create(userId, tenantId, invalidData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if field does not exist or not owned', async () => {
      mockPrismaService.field.findFirst.mockResolvedValue(null);
      await expect(
        service.create(userId, tenantId, bookingData),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client does not exist or not owned', async () => {
      mockPrismaService.field.findFirst.mockResolvedValue({
        id: 'field-1',
        venue: { tenantId },
      });
      mockPrismaService.client.findFirst.mockResolvedValue(null);

      const dataWithClient = { ...bookingData, clientId: 'client-1' };
      await expect(
        service.create(userId, tenantId, dataWithClient),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if there is an overlapping booking', async () => {
      mockPrismaService.field.findFirst.mockResolvedValue({
        id: 'field-1',
        venue: { tenantId },
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          booking: {
            findFirst: jest.fn().mockResolvedValue({ id: 'existing-1' }),
          },
        };
        return callback(tx);
      });

      await expect(
        service.create(userId, tenantId, bookingData),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a booking successfully', async () => {
      const createdBooking = { id: 'booking-1', ...bookingData };
      mockPrismaService.field.findFirst.mockResolvedValue({
        id: 'field-1',
        venue: { tenantId },
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          booking: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(createdBooking),
          },
        };
        return callback(tx);
      });

      const result = await service.create(userId, tenantId, bookingData);
      expect(result).toEqual(createdBooking);
    });
  });

  describe('update', () => {
    const id = 'booking-1';
    const userId = 'user-1';
    const tenantId = 'tenant-1';
    const existingBooking = {
      id,
      fieldId: 'field-1',
      startTime: new Date('2026-06-12T10:00:00Z'),
      endTime: new Date('2026-06-12T11:00:00Z'),
      userId: userId,
    };

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      await expect(service.update(id, tenantId, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent cross-tenant field update', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(existingBooking);
      mockPrismaService.field.findFirst.mockResolvedValue(null); // Field not owned by tenant

      await expect(
        service.update(id, tenantId, { fieldId: 'field-other' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
