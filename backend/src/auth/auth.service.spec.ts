import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;
    let prismaService: PrismaService;
    let emailService: EmailService;

    const mockUsersService = {
        findOne: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    const mockPrismaService = {
        subscriptionPlan: {
            findUnique: jest.fn(),
        },
        passwordResetToken: {
            deleteMany: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        user: {
            update: jest.fn(),
        },
    };

    const mockEmailService = {
        sendWelcomeEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EmailService, useValue: mockEmailService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
        prismaService = module.get<PrismaService>(PrismaService);
        emailService = module.get<EmailService>(EmailService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should throw BadRequestException if email is missing', async () => {
            await expect(service.validateUser('', 'password')).rejects.toThrow(BadRequestException);
            await expect(service.validateUser('', 'password')).rejects.toThrow('El correo es obligatorio');
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockUsersService.findOne.mockResolvedValue(null);
            await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(UnauthorizedException);
            await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow('No encontramos ninguna cuenta con ese correo.');
        });

        it('should throw UnauthorizedException if password mismatch', async () => {
            mockUsersService.findOne.mockResolvedValue({ id: '1', email: 'test@example.com', password: 'hashedpassword' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
            await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow('Contraseña incorrecta. Por favor verifica e intenta de nuevo.');
        });

        it('should return user info without password if validation is successful', async () => {
            const user = {
                id: '1',
                email: 'test@example.com',
                password: 'hashedpassword',
                name: 'Test User',
                role: 'ADMIN',
                plan: 'PRO',
                isActive: true,
                subscriptionEndsAt: new Date(),
                featureOverrides: {}
            };
            mockUsersService.findOne.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validateUser('test@example.com', 'password');
            expect(result).toEqual({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.plan,
                isActive: user.isActive,
                subscriptionEndsAt: user.subscriptionEndsAt,
                featureOverrides: user.featureOverrides
            });
        });
    });

    describe('login', () => {
        it('should return access token and user info', async () => {
            const user = {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'ADMIN',
                plan: 'PRO',
                isActive: true,
                subscriptionEndsAt: new Date(Date.now() + 100000).toISOString(),
                featureOverrides: {}
            };
            const expectedPermissions = { perm1: true };
            mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue({ permissions: expectedPermissions });
            mockJwtService.sign.mockReturnValue('signed_token');

            const result = await service.login(user);

            expect(mockPrismaService.subscriptionPlan.findUnique).toHaveBeenCalledWith({ where: { code: 'PRO' } });
            expect(mockJwtService.sign).toHaveBeenCalled();
            expect(result).toEqual({
                access_token: 'signed_token',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    plan: user.plan,
                    isActive: true,
                    subscriptionEndsAt: user.subscriptionEndsAt,
                    featureOverrides: {},
                    planPermissions: expectedPermissions
                }
            });
        });

        it('should mark inactive if subscription expired', async () => {
            const user = {
                id: '1',
                email: 'test@example.com',
                isActive: true,
                subscriptionEndsAt: new Date(Date.now() - 100000).toISOString()
            };
            mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(null);
            mockJwtService.sign.mockReturnValue('signed_token');

            const result = await service.login(user);

            expect(result.user.isActive).toBe(false);
            expect(mockJwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
        });

        it('should parse featureOverrides if it is a string', async () => {
            const user = {
                id: '1',
                email: 'test@example.com',
                isActive: true,
                featureOverrides: '{"parsed": true}'
            };
            mockPrismaService.subscriptionPlan.findUnique.mockResolvedValue(null);
            mockJwtService.sign.mockReturnValue('signed_token');

            const result = await service.login(user);

            expect(result.user.featureOverrides).toEqual({ parsed: true });
        });
    });

    describe('impersonate', () => {
        it('should throw NotFoundException if user to impersonate is not found', async () => {
            mockUsersService.findById.mockResolvedValue(null);

            await expect(service.impersonate('invalid_id')).rejects.toThrow(NotFoundException);
            await expect(service.impersonate('invalid_id')).rejects.toThrow('Usuario no encontrado');
        });

        it('should return login info for the impersonated user', async () => {
            const targetUser = { id: '2', email: 'target@example.com', isActive: true };
            mockUsersService.findById.mockResolvedValue(targetUser);
            jest.spyOn(service, 'login').mockResolvedValue({ access_token: 'impersonated_token', user: targetUser } as any);

            const result = await service.impersonate('2');

            expect(mockUsersService.findById).toHaveBeenCalledWith('2');
            expect(service.login).toHaveBeenCalledWith(targetUser);
            expect(result).toEqual({ access_token: 'impersonated_token', user: targetUser });
        });
    });

    describe('register', () => {
        it('should throw ConflictException if email already exists', async () => {
            mockUsersService.findOne.mockResolvedValue({ id: '1', email: 'existing@example.com' });

            await expect(service.register({ email: 'existing@example.com', password: 'pass', name: 'Existing' })).rejects.toThrow(ConflictException);
            await expect(service.register({ email: 'existing@example.com', password: 'pass', name: 'Existing' })).rejects.toThrow('Este correo ya tiene una cuenta registrada.');
        });

        it('should create user, send email and return login info on success (FREE_TRIAL)', async () => {
            mockUsersService.findOne.mockRejectedValue(new Error('Not found'));
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
            const createdUser = { id: '1', email: 'new@example.com', name: 'New', role: 'ADMIN', plan: 'FREE_TRIAL', isActive: true };
            mockUsersService.create.mockResolvedValue(createdUser);
            mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);
            jest.spyOn(service, 'login').mockResolvedValue({ access_token: 'new_token', user: createdUser } as any);

            const result = await service.register({ email: 'new@example.com', password: 'pass', name: 'New' });

            expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
            expect(mockUsersService.create).toHaveBeenCalledWith(expect.objectContaining({
                email: 'new@example.com',
                password: 'hashedpassword',
                name: 'New',
                role: 'ADMIN',
                plan: 'FREE_TRIAL',
                isActive: true,
                subscriptionEndsAt: expect.any(Date)
            }));
            expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('New', 'new@example.com');
            expect(service.login).toHaveBeenCalledWith(createdUser);
            expect(result).toEqual({ access_token: 'new_token', user: createdUser });
        });

        it('should create inactive user for paid plans', async () => {
            mockUsersService.findOne.mockRejectedValue(new Error('Not found'));
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
            const createdUser = { id: '1', email: 'paid@example.com', name: 'Paid', role: 'ADMIN', plan: 'PRO', isActive: false };
            mockUsersService.create.mockResolvedValue(createdUser);
            mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);
            jest.spyOn(service, 'login').mockResolvedValue({ access_token: 'new_token', user: createdUser } as any);

            await service.register({ email: 'paid@example.com', password: 'pass', name: 'Paid', plan: 'PRO' });

            expect(mockUsersService.create).toHaveBeenCalledWith(expect.objectContaining({
                email: 'paid@example.com',
                plan: 'PRO',
                isActive: false,
                subscriptionEndsAt: null
            }));
});
});

    describe('forgotPassword', () => {
        it('should return silently if user is not found', async () => {
            mockUsersService.findOne.mockRejectedValue(new Error('Not found'));

            await service.forgotPassword('nonexistent@example.com');

            expect(mockPrismaService.passwordResetToken.deleteMany).not.toHaveBeenCalled();
            expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        });

        it('should invalidate previous tokens, create new token and send email on success', async () => {
            const user = { id: '1', email: 'test@example.com' };
            mockUsersService.findOne.mockResolvedValue(user);
            mockPrismaService.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });
            mockPrismaService.passwordResetToken.create.mockResolvedValue({ id: '1' });

            await service.forgotPassword('test@example.com');

            expect(mockPrismaService.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: '1' } });
            expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    userId: '1',
                    token: expect.any(String),
                    expiresAt: expect.any(Date)
                })
            }));
            expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
        });
    });

    describe('resetPassword', () => {
        it('should throw BadRequestException if token is invalid or expired or used', async () => {
            mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);
            await expect(service.resetPassword('invalid_token', 'newpass')).rejects.toThrow(BadRequestException);

            mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({ used: true });
            await expect(service.resetPassword('used_token', 'newpass')).rejects.toThrow(BadRequestException);

            mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({ used: false, expiresAt: new Date(Date.now() - 100000) });
            await expect(service.resetPassword('expired_token', 'newpass')).rejects.toThrow(BadRequestException);
        });

        it('should hash new password, update user and mark token as used on success', async () => {
            const tokenRecord = { userId: '1', token: 'valid_token', used: false, expiresAt: new Date(Date.now() + 100000) };
            mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(tokenRecord);
            (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpassword');

            await service.resetPassword('valid_token', 'newpass');

            expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 10);
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { password: 'newhashedpassword' }
            });
            expect(mockPrismaService.passwordResetToken.update).toHaveBeenCalledWith({
                where: { token: 'valid_token' },
                data: { used: true }
            });
});
});
});
