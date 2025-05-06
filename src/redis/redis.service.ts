import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = configService.get('REDIS_ENABLED') === 'true';
  }

  async onModuleInit() {
    if (!this.enabled) {
      return;
    }

    try {
      const url = this.configService.get('REDIS_URL', 'redis://localhost:6379');
      this.client = createClient({ url });

      this.client.on('error', (err) => {
        this.logger.error('Redis connection error:', err);
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      // Don't throw error to allow app to function without Redis
      this.enabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.disconnect();
      } catch (error) {
        this.logger.error('Error disconnecting from Redis:', error);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      const options = ttl ? { EX: ttl } : undefined;
      await this.client.set(key, value, options);
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}