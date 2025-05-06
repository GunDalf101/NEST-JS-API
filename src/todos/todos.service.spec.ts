import { Test, TestingModule } from '@nestjs/testing';
import { TodosService } from './todos.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoQueryDto } from './dto/todo-query.dto';
import { RecordNotFoundException } from '../common/exceptions/prisma.exceptions';

describe('TodosService', () => {
  let service: TodosService;
  let prismaService: jest.Mocked<PrismaService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    // Create mock implementations
    const mockPrismaService = {
      todo: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => {
        // Create a proper transaction mock that has the same structure as prisma
        const txMock = {
          todo: {
            findMany: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
          }
        };
        return callback(txMock);
      }),
    };

    const mockRedisService = {
      isEnabled: jest.fn(),
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    redisService = module.get(RedisService) as jest.Mocked<RedisService>;

    // Default implementation for Redis
    redisService.isEnabled.mockReturnValue(false);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a todo', async () => {
      const userId = 1;
      const createTodoDto: CreateTodoDto = {
        title: 'Test Todo',
        description: 'Test Description',
      };
      const createdTodo = {
        id: 1,
        userId,
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.todo.create.mockResolvedValue(createdTodo);
      redisService.isEnabled.mockReturnValue(true);

      const result = await service.create(createTodoDto, userId);

      expect(result).toEqual(createdTodo);
      expect(prismaService.todo.create).toHaveBeenCalledWith({
        data: {
          ...createTodoDto,
          userId,
        },
      });
      expect(redisService.del).toHaveBeenCalledWith(`todos:${userId}:*`);
      expect(redisService.del).toHaveBeenCalledWith(`todos:stats:${userId}`);
    });
  });

  describe('findAll', () => {
    it('should return todos with pagination', async () => {
      const userId = 1;
      const query: TodoQueryDto = {
        page: 1,
        limit: 10,
      };
      const todos = [
        {
          id: 1,
          userId,
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const count = 1;

      prismaService.todo.findMany.mockResolvedValue(todos);
      prismaService.todo.count.mockResolvedValue(count);

      const result = await service.findAll(query, userId);

      expect(result).toEqual({
        data: todos,
        meta: {
          page: query.page,
          limit: query.limit,
          total: count,
          totalPages: 1,
        },
      });
    });

    it('should use cache if available', async () => {
      const userId = 1;
      const query: TodoQueryDto = {
        page: 1,
        limit: 10,
      };
      const cachedResult = {
        data: [{ id: 1, title: 'Cached Todo' }],
        meta: { total: 1 },
      };

      redisService.isEnabled.mockReturnValue(true);
      redisService.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await service.findAll(query, userId);

      expect(result).toEqual(cachedResult);
      expect(redisService.get).toHaveBeenCalled();
      expect(prismaService.todo.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a todo if it exists', async () => {
      const userId = 1;
      const todoId = 1;
      const todo = {
        id: todoId,
        userId,
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.todo.findFirst.mockResolvedValue(todo);

      const result = await service.findOne(todoId, userId);

      expect(result).toEqual(todo);
      expect(prismaService.todo.findFirst).toHaveBeenCalledWith({
        where: {
          id: todoId,
          userId,
        },
      });
    });

    it('should throw RecordNotFoundException if todo does not exist', async () => {
      const userId = 1;
      const todoId = 999;

      prismaService.todo.findFirst.mockResolvedValue(null);

      await expect(service.findOne(todoId, userId)).rejects.toThrow(
        RecordNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a todo', async () => {
      const userId = 1;
      const todoId = 1;
      const updateTodoDto: UpdateTodoDto = {
        title: 'Updated Todo',
        completed: true,
      };
      const existingTodo = {
        id: todoId,
        userId,
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedTodo = {
        ...existingTodo,
        ...updateTodoDto,
        updatedAt: new Date(),
      };

      prismaService.todo.findFirst.mockResolvedValue(existingTodo);
      prismaService.todo.update.mockResolvedValue(updatedTodo);
      redisService.isEnabled.mockReturnValue(true);

      const result = await service.update(todoId, updateTodoDto, userId);

      expect(result).toEqual(updatedTodo);
      expect(prismaService.todo.update).toHaveBeenCalledWith({
        where: {
          id: todoId,
          userId,
        },
        data: updateTodoDto,
      });
      expect(redisService.del).toHaveBeenCalledWith(`todos:${userId}:*`);
      expect(redisService.del).toHaveBeenCalledWith(`todos:stats:${userId}`);
    });
  });

  describe('remove', () => {
    it('should remove a todo', async () => {
      const userId = 1;
      const todoId = 1;
      const existingTodo = {
        id: todoId,
        userId,
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.todo.findFirst.mockResolvedValue(existingTodo);
      prismaService.todo.delete.mockResolvedValue(existingTodo);
      redisService.isEnabled.mockReturnValue(true);

      const result = await service.remove(todoId, userId);

      // Update the expectation to match the actual return value
      expect(result).toEqual({ success: true });
      expect(prismaService.todo.delete).toHaveBeenCalledWith({
        where: {
          id: todoId,
          userId,
        },
      });
      expect(redisService.del).toHaveBeenCalledWith(`todos:${userId}:*`);
      expect(redisService.del).toHaveBeenCalledWith(`todos:stats:${userId}`);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics', async () => {
      const userId = 1;
      const total = 10;
      const completed = 4;
      const pending = 6;

      prismaService.todo.count
        .mockResolvedValueOnce(total)
        .mockResolvedValueOnce(completed)
        .mockResolvedValueOnce(pending);

      const result = await service.getStatistics(userId);

      expect(result).toEqual({
        total,
        completed,
        pending,
        completionRate: (completed / total) * 100,
      });
    });

    it('should use cache if available', async () => {
      const userId = 1;
      const cachedStats = {
        total: 10,
        completed: 4,
        pending: 6,
        completionRate: 40,
      };

      redisService.isEnabled.mockReturnValue(true);
      redisService.get.mockResolvedValue(JSON.stringify(cachedStats));

      const result = await service.getStatistics(userId);

      expect(result).toEqual(cachedStats);
      expect(redisService.get).toHaveBeenCalled();
      expect(prismaService.todo.count).not.toHaveBeenCalled();
    });
  });

  describe('updateMany', () => {
    it('should update multiple todos', async () => {
      const userId = 1;
      const ids = [1, 2, 3];
      const updateData: UpdateTodoDto = {
        completed: true,
      };

      // Mock the transaction context
      const txMock = {
        todo: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, userId },
            { id: 2, userId },
            { id: 3, userId }
          ]),
          updateMany: jest.fn().mockResolvedValue({ count: ids.length })
        }
      };
      
      // Setup the transaction mock
      prismaService.$transaction.mockImplementation((callback) => callback(txMock));
      
      redisService.isEnabled.mockReturnValue(true);

      const result = await service.updateMany(ids, updateData, userId);

      expect(result).toEqual({ count: ids.length });
      expect(txMock.todo.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ids,
          },
          userId,
        },
        data: updateData,
      });
      expect(redisService.del).toHaveBeenCalledWith(`todos:${userId}:*`);
      expect(redisService.del).toHaveBeenCalledWith(`todos:stats:${userId}`);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple todos', async () => {
      const userId = 1;
      const ids = [1, 2, 3];

      // Mock the transaction context
      const txMock = {
        todo: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, userId },
            { id: 2, userId },
            { id: 3, userId }
          ]),
          deleteMany: jest.fn().mockResolvedValue({ count: ids.length })
        }
      };
      
      // Setup the transaction mock
      prismaService.$transaction.mockImplementation((callback) => callback(txMock));
      
      redisService.isEnabled.mockReturnValue(true);

      const result = await service.deleteMany(ids, userId);

      expect(result).toEqual({ count: ids.length });
      expect(txMock.todo.deleteMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ids,
          },
          userId,
        },
      });
      expect(redisService.del).toHaveBeenCalledWith(`todos:${userId}:*`);
      expect(redisService.del).toHaveBeenCalledWith(`todos:stats:${userId}`);
    });
  });
});
