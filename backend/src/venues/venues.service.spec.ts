import { Test, TestingModule } from '@nestjs/testing';
import { VenuesService } from './venues.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('VenuesService', () => {
  let service: VenuesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    venue: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    subscriptionPlan: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenuesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VenuesService>(VenuesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of venues for the given ownerId', async () => {
      const ownerId = 'owner-1';
      const expectedVenues = [{ id: '1', name: 'Venue 1', ownerId }];
      mockPrismaService.venue.findMany.mockResolvedValue(expectedVenues);

      const result = await service.findAll(ownerId);

      expect(mockPrismaService.venue.findMany).toHaveBeenCalledWith({
        where: { ownerId, deletedAt: null },
        include: { fields: { where: { deletedAt: null } } },
      });
      expect(result).toEqual(expectedVenues);
    });
  });

  describe('findOne', () => {
    it('should return a venue if it exists and belongs to the owner', async () => {
      const id = '1';
      const ownerId = 'owner-1';
      const expectedVenue = { id, name: 'Venue 1', ownerId };
      mockPrismaService.venue.findFirst.mockResolvedValue(expectedVenue);

      const result = await service.findOne(id, ownerId);

      expect(mockPrismaService.venue.findFirst).toHaveBeenCalledWith({
        where: { id, ownerId, deletedAt: null },
        include: { fields: { where: { deletedAt: null } } },
      });
      expect(result).toEqual(expectedVenue);
    });

    it('should throw NotFoundException if venue does not exist', async () => {
      const id = '1';
      const ownerId = 'owner-1';
      mockPrismaService.venue.findFirst.mockResolvedValue(null);

      await expect(service.findOne(id, ownerId)).rejects.toThrow(
        new NotFoundException('Sede no encontrada.'),
      );
    });
  });

  describe('create', () => {
    const ownerId = 'owner-1';
    const createData = { name: 'New Venue', address: '123 St' };

    it('should create a venue if user and plan exist and limit is not reached', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ plan: 'BASIC' });
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue({
        code: 'BASIC',
        name: 'Basic Plan',
        limitVenues: 5,
      });
      mockPrismaService.venue.count.mockResolvedValue(2);

      const createdVenue = { id: 'new-id', ...createData, ownerId };
      mockPrismaService.venue.create.mockResolvedValue(createdVenue);

      const result = await service.create(ownerId, createData);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: ownerId },
        select: { plan: true },
      });
      expect(mockPrismaService.subscriptionPlan.findUnique).toHaveBeenCalledWith({
        where: { code: 'BASIC' },
      });
      expect(mockPrismaService.venue.count).toHaveBeenCalledWith({
        where: { ownerId, deletedAt: null },
      });
      expect(mockPrismaService.venue.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          owner: { connect: { id: ownerId } },
        },
      });
      expect(result).toEqual(createdVenue);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(ownerId, createData)).rejects.toThrow(
        new NotFoundException('Usuario no encontrado'),
      );
    });

    it('should throw ForbiddenException if subscription plan is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ plan: 'INVALID' });
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(service.create(ownerId, createData)).rejects.toThrow(
        new ForbiddenException('Plan de suscripción no válido'),
      );
    });

    it('should throw ForbiddenException if venue limit is reached', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ plan: 'BASIC' });
      mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue({
        code: 'BASIC',
        name: 'Basic Plan',
        limitVenues: 1,
      });
      mockPrismaService.venue.count.mockResolvedValue(1); // Limit reached

      await expect(service.create(ownerId, createData)).rejects.toThrow(
        new ForbiddenException(
          `Has alcanzado el límite de sedes (1) para tu plan Basic Plan. Mejora tu suscripción.`,
        ),
      );
    });
  });

  describe('update', () => {
    const id = '1';
    const ownerId = 'owner-1';
    const updateData = { name: 'Updated Venue' };

    it('should update the venue if it exists', async () => {
      mockPrismaService.venue.findFirst.mockResolvedValue({ id, ownerId });
      const updatedVenue = { id, ownerId, ...updateData };
      mockPrismaService.venue.update.mockResolvedValue(updatedVenue);

      const result = await service.update(id, ownerId, updateData);

      expect(mockPrismaService.venue.findFirst).toHaveBeenCalledWith({
        where: { id, ownerId, deletedAt: null },
      });
      expect(mockPrismaService.venue.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData,
      });
      expect(result).toEqual(updatedVenue);
    });

    it('should throw NotFoundException if venue does not exist for update', async () => {
      mockPrismaService.venue.findFirst.mockResolvedValue(null);

      await expect(service.update(id, ownerId, updateData)).rejects.toThrow(
        new NotFoundException('Sede no encontrada o no tienes permisos.'),
      );
    });
  });

  describe('remove', () => {
    const id = '1';
    const ownerId = 'owner-1';

    it('should soft delete the venue if it exists', async () => {
      mockPrismaService.venue.findFirst.mockResolvedValue({ id, ownerId });
      const deletedVenue = { id, ownerId, deletedAt: new Date() };
      mockPrismaService.venue.update.mockResolvedValue(deletedVenue);

      const result = await service.remove(id, ownerId);

      expect(mockPrismaService.venue.findFirst).toHaveBeenCalledWith({
        where: { id, ownerId, deletedAt: null },
      });

      // We check that update was called with a deletedAt value that is a Date object
      expect(mockPrismaService.venue.update).toHaveBeenCalledWith({
        where: { id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual(deletedVenue);
    });

    it('should throw NotFoundException if venue does not exist for removal', async () => {
      mockPrismaService.venue.findFirst.mockResolvedValue(null);

      await expect(service.remove(id, ownerId)).rejects.toThrow(
        new NotFoundException('Sede no encontrada o no tienes permisos.'),
      );
    });
  });
});
