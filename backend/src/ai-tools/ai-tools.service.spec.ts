import { Test, TestingModule } from '@nestjs/testing';
import { AiToolsService } from './ai-tools.service';
import { PrismaService } from '../prisma.service';

describe('AiToolsService', () => {
  let service: AiToolsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiToolsService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<AiToolsService>(AiToolsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailability', () => {
    it('should throw BadRequestException if date is missing', async () => {
      await expect(service.getAvailability('', 'venue-123')).rejects.toThrow(
        'date and venueId are required',
      );
    });

    it('should throw BadRequestException if venueId is missing', async () => {
      await expect(service.getAvailability('2023-10-10', '')).rejects.toThrow(
        'date and venueId are required',
      );
    });

    it('should throw BadRequestException if both date and venueId are missing', async () => {
      await expect(service.getAvailability('', '')).rejects.toThrow(
        'date and venueId are required',
      );
    });
  });
});
