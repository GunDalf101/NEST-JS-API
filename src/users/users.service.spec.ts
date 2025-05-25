import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RecordNotFoundException, UniqueConstraintException } from '../common/exceptions/prisma.exceptions';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password')
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    // Create mock implementations
    const mockPrismaService = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
      };
      
      const createdUserWithoutPassword = {
        id: 1,
        email: createUserDto.email,
        name: createUserDto.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.create.mockResolvedValue(createdUserWithoutPassword);

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(result).toEqual(createdUserWithoutPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: 'hashed_password',
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw UniqueConstraintException when email already exists', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
      };

      // Create a proper Prisma error
      const prismaError = new PrismaClientKnownRequestError('Unique constraint violation', {
        code: 'P2002',
        clientVersion: '2.0.0',
        meta: { target: ['email'] }
      });

      prismaService.user.create.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(UniqueConstraintException);
    });

    it('should rethrow other errors', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
      };

      const error = new Error('Database connection error');
      prismaService.user.create.mockRejectedValue(error);

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow('Database connection error');
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      // Arrange
      const users = [
        {
          id: 1,
          email: 'test1@example.com',
          name: 'Test User 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          email: 'test2@example.com',
          name: 'Test User 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaService.user.findMany.mockResolvedValue(users);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(users);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user if it exists', async () => {
      // Arrange
      const userId = 1;
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(user);

      // Act
      const result = await service.findOne(userId);

      // Assert
      expect(result).toEqual({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw RecordNotFoundException if user does not exist', async () => {
      // Arrange
      const userId = 999;
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId)).rejects.toThrow(RecordNotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user if it exists', async () => {
      // Arrange
      const email = 'test@example.com';
      const user = {
        id: 1,
        email,
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(user);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(result).toEqual(user);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should throw RecordNotFoundException if user does not exist', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByEmail(email)).rejects.toThrow(RecordNotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      // Arrange
      const userId = 1;
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        createdAt: existingUser.createdAt,
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);
      prismaService.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(userId, updateUserDto);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw RecordNotFoundException if user does not exist', async () => {
      // Arrange
      const userId = 999;
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(userId, updateUserDto)).rejects.toThrow(RecordNotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      // Arrange
      const userId = 1;
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const deletedUserWithoutPassword = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt,
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);
      prismaService.user.delete.mockResolvedValue(deletedUserWithoutPassword);

      // Act
      const result = await service.remove(userId);

      // Assert
      expect(result).toEqual(deletedUserWithoutPassword);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw RecordNotFoundException if user does not exist', async () => {
      // Arrange
      const userId = 999;
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(RecordNotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaService.user.delete).not.toHaveBeenCalled();
    });
  });
});
