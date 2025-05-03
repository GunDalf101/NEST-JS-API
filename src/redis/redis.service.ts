import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);
  private redisEnabled = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.redisClient = new Redis({
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't retry connections
      });
      
      // Test the connection
      await this.redisClient.ping();
      this.redisEnabled = true;
      this.logger.log('Successfully connected to Redis');
    } catch (error) {
      this.redisEnabled = false;
      this.logger.warn('Redis connection failed, running without caching');
      // Close the client if it was created but couldn't connect
      if (this.redisClient) {
        this.redisClient.disconnect();
        this.redisClient = null;
      }
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  isEnabled(): boolean {
    return this.redisEnabled;
  }

  getClient(): Redis | null {
    return this.redisClient;
  }

  async set(key: string, value: string, expireIn?: number): Promise<void> {
    if (!this.redisEnabled || !this.redisClient) return;
    
    try {
      if (expireIn) {
        await this.redisClient.set(key, value, 'EX', expireIn);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      this.logger.warn(`Redis set operation failed: ${error.message}`);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.redisEnabled || !this.redisClient) return null;
    
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      this.logger.warn(`Redis get operation failed: ${error.message}`);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redisEnabled || !this.redisClient) return;
    
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.warn(`Redis del operation failed: ${error.message}`);
    }
  }
}