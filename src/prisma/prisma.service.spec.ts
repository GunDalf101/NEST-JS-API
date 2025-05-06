import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { DatabaseException, RecordNotFoundException, UniqueConstraintException } from '../common/exceptions/prisma.exceptions';

describe('PrismaService', () => {
  let service: PrismaService;
  
  // Mock the Prisma client methods
  const mockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $use: jest.fn(),
    user: { deleteMany: jest.fn() },
    todo: { deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    // Reset the mocks
    jest.clearAllMocks();
    
    // Set up the test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    // Get the service instance and replace the methods with mocks
    service = module.get<PrismaService>(PrismaService);
    Object.defineProperty(service, '$connect', { value: mockPrismaClient.$connect });
    Object.defineProperty(service, '$disconnect', { value: mockPrismaClient.$disconnect });
    Object.defineProperty(service, '$transaction', { value: mockPrismaClient.$transaction });
    Object.defineProperty(service, '$use', { value: mockPrismaClient.$use });
    Object.defineProperty(service, 'user', { value: mockPrismaClient.user });
    Object.defineProperty(service, 'todo', { value: mockPrismaClient.todo });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('lifecycle methods', () => {
    it('should connect on module init', async () => {
      await service.onModuleInit();
      expect(mockPrismaClient.$connect).toHaveBeenCalled();
    });

    it('should disconnect on module destroy', async () => {
      await service.onModuleDestroy();
      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
    });
  });

  describe('error handling middleware', () => {
    let middleware: any;
    
    beforeEach(async () => {
      // Capture the middleware function
      mockPrismaClient.$use.mockImplementation((fn) => {
        middleware = fn;
      });
      
      await service.onModuleInit();
    });

    it('should register middleware on init', () => {
      expect(mockPrismaClient.$use).toHaveBeenCalled();
      expect(middleware).toBeDefined();
    });

    it('should pass through when no error', async () => {
      const params = { model: 'User' };
      const result = { id: 1, name: 'Test' };
      const next = jest.fn().mockResolvedValue(result);
      
      const response = await middleware(params, next);
      
      expect(next).toHaveBeenCalledWith(params);
      expect(response).toBe(result);
    });

    it('should throw UniqueConstraintException for P2002 errors', async () => {
      const params = { model: 'User' };
      const error = { code: 'P2002', meta: { target: ['email'] } };
      const next = jest.fn().mockRejectedValue(error);
      
      await expect(middleware(params, next)).rejects.toBeInstanceOf(UniqueConstraintException);
    });

    it('should throw RecordNotFoundException for P2025 errors', async () => {
      const params = { model: 'User' };
      const error = { code: 'P2025' };
      const next = jest.fn().mockRejectedValue(error);
      
      await expect(middleware(params, next)).rejects.toBeInstanceOf(RecordNotFoundException);
    });

    it('should throw DatabaseException for other errors', async () => {
      const params = { model: 'User' };
      const error = { code: 'OTHER_ERROR' };
      const next = jest.fn().mockRejectedValue(error);
      
      await expect(middleware(params, next)).rejects.toBeInstanceOf(DatabaseException);
    });
  });

  describe('cleanDatabase', () => {
    it('should call deleteMany on all models', async () => {
      mockPrismaClient.$transaction.mockResolvedValue([{ count: 1 }, { count: 2 }]);
      mockPrismaClient.user.deleteMany.mockReturnValue('user-deletion');
      mockPrismaClient.todo.deleteMany.mockReturnValue('todo-deletion');
      
      await service.cleanDatabase();
      
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      const transactionArg = mockPrismaClient.$transaction.mock.calls[0][0];
      expect(Array.isArray(transactionArg)).toBe(true);
    });
  });

  describe('transaction', () => {
    it('should execute the transaction function', async () => {
      const transactionResult = { success: true };
      mockPrismaClient.$transaction.mockImplementation(async (callback) => {
        return await callback(service);
      });
      
      const fn = jest.fn().mockResolvedValue(transactionResult);
      const result = await service.transaction(fn);
      
      expect(result).toBe(transactionResult);
      expect(fn).toHaveBeenCalledWith(service);
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });
  });
});
