import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.redisService.isEnabled()) {
      return true;
    }

    try {
      const request = context.switchToHttp().getRequest();
      const ip = request.ip;
      const key = `rate_limit:${ip}`;

      const points = this.configService.get<number>('RATE_LIMIT_POINTS', 100);
      const duration = this.configService.get<number>('RATE_LIMIT_DURATION', 60);

      const current = await this.redisService.get(key);
      
      if (current === null) {
        await this.redisService.set(key, '1', duration);
        return true;
      }

      const count = parseInt(current, 10);
      
      if (count >= points) {
        throw new TooManyRequestsException();
      }

      await this.redisService.set(key, (count + 1).toString(), duration);
      return true;
    } catch (error) {
      if (error instanceof TooManyRequestsException) {
        throw error;
      }
      // If Redis fails, allow the request
      return true;
    }
  }
}