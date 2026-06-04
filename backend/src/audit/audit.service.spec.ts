import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should handle error when prisma create fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Database connection failed');

      jest.spyOn(prismaService.auditLog, 'create').mockRejectedValueOnce(mockError);

      await service.log('CREATE', '123', 'User');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save audit log:', mockError);

      consoleSpy.mockRestore();
    });
  });
});
