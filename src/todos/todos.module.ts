import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { RedisModule } from '../redis/redis.module';

/**
 * Module for the Todo functionality
 * Handles todo items for users
 */
@Module({
  imports: [
    PrismaModule,
    CommonModule,
    RedisModule
  ],
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService]
})
export class TodosModule {}