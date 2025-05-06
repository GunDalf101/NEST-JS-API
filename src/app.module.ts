import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AppConfigModule } from './config/config.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TodosModule } from './todos/todos.module';
import { CommonModule } from './common/common.module';

/**
 * Main application module that organizes all feature modules
 * and sets up global configurations
 */
@Module({
  imports: [
    // Core infrastructure modules
    AppConfigModule,
    PrismaModule,
    RedisModule,
    CommonModule,
    
    // Security and rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
    
    // Feature modules
    UsersModule,
    AuthModule,
    TodosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}