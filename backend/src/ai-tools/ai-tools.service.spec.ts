import { Test, TestingModule } from '@nestjs/testing';
import { AiToolsService } from './ai-tools.service';
import { PrismaService } from '../prisma.service';

const mockPrismaService = {
  field: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  booking: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  venue: {
    findUnique: jest.fn(),
  },
  client: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AiToolsService', () => {
  let service: AiToolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiToolsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AiToolsService>(AiToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
