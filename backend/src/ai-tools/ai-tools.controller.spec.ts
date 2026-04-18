import { Test, TestingModule } from '@nestjs/testing';
import { AiToolsController } from './ai-tools.controller';

describe('AiToolsController', () => {
  let controller: AiToolsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiToolsController],
    }).compile();

    controller = module.get<AiToolsController>(AiToolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
