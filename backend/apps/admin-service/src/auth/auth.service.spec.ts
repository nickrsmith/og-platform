import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { PrismaService } from '@app/database';
import { ChangePasswordDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: {
    adminUser: {
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
    };
    jtiBlocklist: {
      create: jest.Mock;
    };
  };
  let jwtService: jest.Mocked<JwtService>;
  let cache: jest.Mocked<any>;

  beforeEach(async () => {
    // Create mock implementations
    const mockPrismaService = {
      adminUser: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      jtiBlocklist: {
        create: jest.fn(),
      },
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockCache = {
      set: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    cache = module.get(CACHE_MANAGER);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = '$2b$10$hashedpassword';
    const adminId = 'admin-id-123';
    const mockAdmin = {
      id: adminId,
      email,
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      lastLoginAt: null,
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      prismaService.adminUser.findUnique.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.signAsync.mockResolvedValue(mockToken);
      prismaService.adminUser.update.mockResolvedValue({
        ...mockAdmin,
        lastLoginAt: new Date(),
      });

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(result).toEqual({ accessToken: mockToken });
      expect(prismaService.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare as jest.Mock).toHaveBeenCalledWith(
        password,
        hashedPassword,
      );
      expect(jwtService.signAsync as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: adminId,
          email,
        }),
      );
      expect(prismaService.adminUser.update).toHaveBeenCalledWith({
        where: { id: adminId },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException when admin user not found', async () => {
      // Arrange
      prismaService.adminUser.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prismaService.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare as jest.Mock).not.toHaveBeenCalled();
      expect(jwtService.signAsync as jest.Mock).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Arrange
      prismaService.adminUser.findUnique.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockedBcrypt.compare as jest.Mock).toHaveBeenCalledWith(
        password,
        hashedPassword,
      );
      expect(jwtService.signAsync as jest.Mock).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should add JTI to cache and database when token is not expired', async () => {
      // Arrange
      const jti = 'jti-123';
      const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      prismaService.jtiBlocklist.create.mockResolvedValue({
        id: 'blocklist-id',
        jti,
        exp: new Date(exp * 1000),
      });

      // Act
      await service.logout(jti, exp);

      // Assert

      expect(cache.set as jest.Mock).toHaveBeenCalledWith(
        `jti-block:${jti}`,
        true,
        expect.any(Number),
      );
      expect(prismaService.jtiBlocklist.create).toHaveBeenCalledWith({
        data: { jti, exp: new Date(exp * 1000) },
      });
    });

    it('should not add to cache or database when token is already expired', async () => {
      // Arrange
      const jti = 'jti-123';
      const exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      // Act
      await service.logout(jti, exp);

      // Assert

      expect(cache.set as jest.Mock).not.toHaveBeenCalled();
      expect(prismaService.jtiBlocklist.create).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const userId = 'user-id-123';
    const currentPassword = 'currentPassword123';
    const newPassword = 'newPassword123';
    const currentHash = '$2b$10$currentHash';
    const newHash = '$2b$10$newHash';

    const mockAdmin = {
      id: userId,
      email: 'test@example.com',
      passwordHash: currentHash,
      firstName: 'Test',
      lastName: 'User',
    };

    const changePasswordDto: ChangePasswordDto = {
      currentPassword,
      newPassword,
    };

    it('should successfully change password with valid current password', async () => {
      // Arrange
      prismaService.adminUser.findUniqueOrThrow.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue(newHash as never);
      prismaService.adminUser.update.mockResolvedValue({
        ...mockAdmin,
        passwordHash: newHash,
      });

      // Act
      await service.changePassword(userId, changePasswordDto);

      // Assert
      expect(prismaService.adminUser.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockedBcrypt.compare as jest.Mock).toHaveBeenCalledWith(
        currentPassword,
        currentHash,
      );
      expect(mockedBcrypt.hash as jest.Mock).toHaveBeenCalledWith(
        newPassword,
        10,
      );
      expect(prismaService.adminUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: newHash },
      });
    });

    it('should throw UnauthorizedException when current password is incorrect', async () => {
      // Arrange
      prismaService.adminUser.findUniqueOrThrow.mockResolvedValue(mockAdmin);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockedBcrypt.hash as jest.Mock).not.toHaveBeenCalled();
      expect(prismaService.adminUser.update).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    const userId = 'user-id-123';
    const mockAdmin = {
      id: userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should return admin user data', async () => {
      // Arrange
      prismaService.adminUser.findUnique.mockResolvedValue(mockAdmin);

      // Act
      const result = await service.getMe(userId);

      // Assert
      expect(result).toEqual(mockAdmin);
      expect(prismaService.adminUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
    });

    it('should throw NotFoundException when admin user not found', async () => {
      // Arrange
      prismaService.adminUser.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getMe(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
