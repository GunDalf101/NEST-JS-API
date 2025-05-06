import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as redis from 'redis';

// Mock the redis module
jest.mock('redis', () => {
  const mockClient = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
  };
  return {
    createClient: jest.fn(() => mockClient),
  };
});

describe('RedisService', () => {
  let service: RedisService;
  let configService: jest.Mocked<ConfigService>;
  let mockClient;
  let mockLogger;

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    mockClient = redis.createClient();

    // Create logger mock to suppress error logs
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // Create config service mock
    const mockConfigService = {
      get: jest.fn((key, defaultValue) => {
        if (key === 'REDIS_ENABLED') return 'true';
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    
    // Replace the RedisService's logger with our mock
    Object.defineProperty(service, 'logger', { 
      value: mockLogger,
      writable: true,
      configurable: true 
    });
    
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should initialize Redis client when enabled', async () => {
      await service.onModuleInit();
      
      expect(redis.createClient).toHaveBeenCalledWith({ 
        url: 'redis://localhost:6379' 
      });
      expect(mockClient.connect).toHaveBeenCalled();
      expect(service.isEnabled()).toBe(true);
    });

    it('should not initialize Redis client when disabled', async () => {
      // Clear all mocks first
      jest.clearAllMocks();
      
      // Create a new mocked config service that returns false for REDIS_ENABLED
      const disabledConfigService = {
        get: jest.fn((key) => {
          if (key === 'REDIS_ENABLED') return 'false';
          return null;
        }),
      };
      
      const disabledRedisService = new RedisService(disabledConfigService as unknown as ConfigService);
      
      // Replace the logger with our mock to suppress error logs
      Object.defineProperty(disabledRedisService, 'logger', { 
        value: mockLogger,
        writable: true,
        configurable: true 
      });
      
      await disabledRedisService.onModuleInit();
      
      expect(redis.createClient).not.toHaveBeenCalled();
      expect(mockClient.connect).not.toHaveBeenCalled();
      expect(disabledRedisService.isEnabled()).toBe(false);
    });

    it('should handle connection errors gracefully', async () => {
      mockClient.connect.mockRejectedValueOnce(new Error('Connection error'));
      
      await service.onModuleInit();
      
      expect(service.isEnabled()).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should disconnect on module destroy', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();
      
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      mockClient.disconnect.mockRejectedValueOnce(new Error('Disconnect error'));
      
      await service.onModuleInit();
      await service.onModuleDestroy();
      
      // Should not throw
      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('operations', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    describe('get', () => {
      it('should get value from Redis', async () => {
        const mockValue = 'test-value';
        mockClient.get.mockResolvedValueOnce(mockValue);
        
        const result = await service.get('test-key');
        
        expect(result).toBe(mockValue);
        expect(mockClient.get).toHaveBeenCalledWith('test-key');
      });

      it('should return null if Redis is not enabled', async () => {
        // Create a new service instance with Redis disabled
        const disabledConfigService = {
          get: jest.fn((key) => {
            if (key === 'REDIS_ENABLED') return 'false';
            return null;
          }),
        };
        
        const disabledService = new RedisService(disabledConfigService as unknown as ConfigService);
        
        // Replace the logger with our mock to suppress error logs
        Object.defineProperty(disabledService, 'logger', { 
          value: mockLogger,
          writable: true,
          configurable: true 
        });
        
        const result = await disabledService.get('test-key');
        
        expect(result).toBeNull();
        expect(mockClient.get).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockClient.get.mockRejectedValueOnce(new Error('Get error'));
        
        const result = await service.get('test-key');
        
        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalled();
      });
    });

    describe('set', () => {
      it('should set value in Redis', async () => {
        mockClient.set.mockResolvedValueOnce('OK');
        
        const result = await service.set('test-key', 'test-value');
        
        expect(result).toBe(true);
        expect(mockClient.set).toHaveBeenCalledWith('test-key', 'test-value', undefined);
      });

      it('should set value with TTL', async () => {
        mockClient.set.mockResolvedValueOnce('OK');
        
        const result = await service.set('test-key', 'test-value', 60);
        
        expect(result).toBe(true);
        expect(mockClient.set).toHaveBeenCalledWith('test-key', 'test-value', { EX: 60 });
      });

      it('should return false if Redis is not enabled', async () => {
        // Create a new service instance with Redis disabled
        const disabledConfigService = {
          get: jest.fn((key) => {
            if (key === 'REDIS_ENABLED') return 'false';
            return null;
          }),
        };
        
        const disabledService = new RedisService(disabledConfigService as unknown as ConfigService);
        
        // Replace the logger with our mock to suppress error logs
        Object.defineProperty(disabledService, 'logger', { 
          value: mockLogger,
          writable: true,
          configurable: true 
        });
        
        const result = await disabledService.set('test-key', 'test-value');
        
        expect(result).toBe(false);
        expect(mockClient.set).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockClient.set.mockRejectedValueOnce(new Error('Set error'));
        
        const result = await service.set('test-key', 'test-value');
        
        expect(result).toBe(false);
        expect(mockLogger.error).toHaveBeenCalled();
      });
    });

    describe('del', () => {
      it('should delete key from Redis', async () => {
        mockClient.del.mockResolvedValueOnce(1);
        
        const result = await service.del('test-key');
        
        expect(result).toBe(true);
        expect(mockClient.del).toHaveBeenCalledWith('test-key');
      });

      it('should return false if Redis is not enabled', async () => {
        // Create a new service instance with Redis disabled
        const disabledConfigService = {
          get: jest.fn((key) => {
            if (key === 'REDIS_ENABLED') return 'false';
            return null;
          }),
        };
        
        const disabledService = new RedisService(disabledConfigService as unknown as ConfigService);
        
        // Replace the logger with our mock to suppress error logs
        Object.defineProperty(disabledService, 'logger', { 
          value: mockLogger,
          writable: true,
          configurable: true 
        });
        
        const result = await disabledService.del('test-key');
        
        expect(result).toBe(false);
        expect(mockClient.del).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockClient.del.mockRejectedValueOnce(new Error('Delete error'));
        
        const result = await service.del('test-key');
        
        expect(result).toBe(false);
        expect(mockLogger.error).toHaveBeenCalled();
      });
    });
  });
});
