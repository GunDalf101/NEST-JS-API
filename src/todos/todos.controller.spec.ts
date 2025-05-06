import { Test } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoQueryDto } from './dto/todo-query.dto';
import { AppLogger } from '../common/services/logger.service';

describe('TodosController', () => {
  let controller: TodosController;
  let service: TodosService;
  let logger: AppLogger;

  const mockTodosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStatistics: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockAppLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [
        {
          provide: TodosService,
          useValue: mockTodosService,
        },
        {
          provide: AppLogger,
          useValue: mockAppLogger,
        },
      ],
    }).compile();

    controller = module.get<TodosController>(TodosController);
    service = module.get<TodosService>(TodosService);
    logger = module.get<AppLogger>(AppLogger);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a todo', async () => {
      const userId = 1;
      const createTodoDto: CreateTodoDto = { title: 'Test Todo' };
      const expectedTodo = { id: 1, ...createTodoDto, userId, createdAt: new Date(), updatedAt: new Date() };
      
      mockTodosService.create.mockResolvedValue(expectedTodo);
      
      const result = await controller.create(createTodoDto, userId);
      
      expect(result).toEqual(expectedTodo);
      expect(mockTodosService.create).toHaveBeenCalledWith(createTodoDto, userId);
      expect(mockAppLogger.log).toHaveBeenCalledWith(`Creating todo for user ${userId}`);
    });
  });

  describe('findAll', () => {
    it('should return paginated todos', async () => {
      const userId = 1;
      const query: TodoQueryDto = { page: 1, limit: 10 };
      const expectedResult = {
        data: [{ id: 1, title: 'Test Todo', userId }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      
      mockTodosService.findAll.mockResolvedValue(expectedResult);
      
      const result = await controller.findAll(query, userId);
      
      expect(result).toEqual(expectedResult);
      expect(mockTodosService.findAll).toHaveBeenCalledWith(query, userId);
      expect(mockAppLogger.log).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a todo by id', async () => {
      const userId = 1;
      const todoId = 1;
      const expectedTodo = { id: todoId, title: 'Test Todo', userId };
      
      mockTodosService.findOne.mockResolvedValue(expectedTodo);
      
      const result = await controller.findOne(todoId, userId);
      
      expect(result).toEqual(expectedTodo);
      expect(mockTodosService.findOne).toHaveBeenCalledWith(todoId, userId);
      expect(mockAppLogger.log).toHaveBeenCalled();
    });
  });
  
  describe('update', () => {
    it('should update a todo', async () => {
      const userId = 1;
      const todoId = 1;
      const updateTodoDto: UpdateTodoDto = { title: 'Updated Todo', completed: true };
      const expectedTodo = { 
        id: todoId, 
        title: 'Updated Todo', 
        completed: true, 
        userId,
        updatedAt: new Date()
      };
      
      mockTodosService.update.mockResolvedValue(expectedTodo);
      
      const result = await controller.update(todoId, updateTodoDto, userId);
      
      expect(result).toEqual(expectedTodo);
      expect(mockTodosService.update).toHaveBeenCalledWith(todoId, updateTodoDto, userId);
      expect(mockAppLogger.log).toHaveBeenCalled();
    });
  });
  
  describe('remove', () => {
    it('should remove a todo', async () => {
      const userId = 1;
      const todoId = 1;
      const expectedResult = { success: true };
      
      mockTodosService.remove.mockResolvedValue(expectedResult);
      
      const result = await controller.remove(todoId, userId);
      
      expect(result).toEqual(expectedResult);
      expect(mockTodosService.remove).toHaveBeenCalledWith(todoId, userId);
      expect(mockAppLogger.log).toHaveBeenCalled();
    });
  });
  
  describe('getStatistics', () => {
    it('should return todo statistics', async () => {
      const userId = 1;
      const expectedStats = { 
        total: 10, 
        completed: 5, 
        pending: 5, 
        completionRate: 50 
      };
      
      mockTodosService.getStatistics.mockResolvedValue(expectedStats);
      
      const result = await controller.getStatistics(userId);
      
      expect(result).toEqual(expectedStats);
      expect(mockTodosService.getStatistics).toHaveBeenCalledWith(userId);
      expect(mockAppLogger.log).toHaveBeenCalled();
    });
  });
  
  describe('updateMany', () => {
    it('should update multiple todos', async () => {
      const userId = 1;
      const ids = [1, 2, 3];
      const updateData: UpdateTodoDto = { completed: true };
      const expectedResult = { count: 3 };
      
      mockTodosService.updateMany.mockResolvedValue(expectedResult);
      
      const result = await controller.updateMany(ids, updateData, userId);
      
      expect(result).toEqual(expectedResult);
      expect(mockTodosService.updateMany).toHaveBeenCalledWith(ids, updateData, userId);
      expect(mockAppLogger.log).toHaveBeenCalled();
    });
  });
  
  describe('deleteMany', () => {
    it('should delete multiple todos', async () => {
      const userId = 1;
      const ids = [1, 2, 3];
      const expectedResult = { count: 3 };
      
      mockTodosService.deleteMany.mockResolvedValue(expectedResult);
      
      const result = await controller.deleteMany(ids, userId);
      
      expect(result).toEqual(expectedResult);
      expect(mockTodosService.deleteMany).toHaveBeenCalledWith(ids, userId);
      expect(mockAppLogger.log).toHaveBeenCalled();
    });
  });
});
