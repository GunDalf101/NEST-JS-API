import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly defaultTTL = 3600; // 1 hour in seconds

  constructor(private readonly redisService: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    if (!this.redisService.isEnabled()) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = request.url;

    try {
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        return of(JSON.parse(cachedData));
      }
    } catch (error) {
      this.logger.error(`Error retrieving cached data: ${error.message}`);
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          await this.redisService.set(
            cacheKey,
            JSON.stringify(responseData),
            this.defaultTTL
          );
        } catch (error) {
          this.logger.error(`Error caching response data: ${error.message}`);
        }
      })
    );
  }
}