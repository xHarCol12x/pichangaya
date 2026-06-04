import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { ForbiddenException } from '@nestjs/common';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should throw ForbiddenException if user is not SUPER_ADMIN', () => {
      const req = { user: { role: 'USER' } };
      expect(() => controller.findAll(req)).toThrow(ForbiddenException);
      expect(() => controller.findAll(req)).toThrow('Acesso denegado. Se requiere rol de SUPER_ADMIN.');
    });

    it('should call auditService.findAll and return its result if user is SUPER_ADMIN', () => {
      const req = { user: { role: 'SUPER_ADMIN' } };
      const expectedResult = [{ id: 1, action: 'test' }];
      jest.spyOn(auditService, 'findAll').mockReturnValue(expectedResult as any);

      const result = controller.findAll(req);

      expect(auditService.findAll).toHaveBeenCalledWith(50);
      expect(result).toBe(expectedResult);
    });

    it('should call auditService.findAll with provided limit', () => {
      const req = { user: { role: 'SUPER_ADMIN' } };
      const limit = 10;
      jest.spyOn(auditService, 'findAll').mockReturnValue([] as any);

      controller.findAll(req, limit);

      expect(auditService.findAll).toHaveBeenCalledWith(limit);
    });
  });
});
