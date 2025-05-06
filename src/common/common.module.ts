import { Module, Global } from '@nestjs/common';
import { AppLogger } from './services/logger.service';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { GlobalExceptionFilter } from './exceptions/global.filter';
import { ValidationPipe } from './pipes/validation.pipe';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { AppConfigModule } from '../config/config.module';

@Global()
@Module({
  imports: [
    AppConfigModule,
  ],
  providers: [
    AppLogger,
    HttpExceptionFilter,
    GlobalExceptionFilter,
    ValidationPipe,
    CacheInterceptor,
    RateLimitGuard
  ],
  exports: [
    AppLogger,
    HttpExceptionFilter,
    GlobalExceptionFilter,
    ValidationPipe,
    CacheInterceptor,
    RateLimitGuard
  ]
})
export class CommonModule {} 