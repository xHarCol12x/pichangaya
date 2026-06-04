import { Test, TestingModule } from '@nestjs/testing';
import { AiToolsService } from './ai-tools.service';
import { PrismaService } from '../prisma.service';

describe('AiToolsService', () => {
  let service: AiToolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiToolsService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<AiToolsService>(AiToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
