import { Test, TestingModule } from '@nestjs/testing';
import { AiToolsController } from './ai-tools.controller';
import { AiToolsService } from './ai-tools.service';

describe('AiToolsController', () => {
  let controller: AiToolsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiToolsController],
      providers: [{ provide: AiToolsService, useValue: {} }],
    }).compile();

    controller = module.get<AiToolsController>(AiToolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
