import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

import { DatabaseException, RecordNotFoundException, UniqueConstraintException } from '../common/exceptions/prisma.exceptions';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();

    // Add middleware to handle Prisma errors
    this.$use(async (params, next) => {
      try {
        return await next(params);
      } catch (error) {
        if (error.code === 'P2002') {
          throw new UniqueConstraintException(error.meta?.target?.[0] || 'field');
        }
        if (error.code === 'P2025') {
          throw new RecordNotFoundException(params.model || 'Unknown', 'record');
        }
        throw new DatabaseException(error);
      }
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    const modelKeys = Reflect.ownKeys(this).filter((key) => {
      return (
        typeof key === 'string' &&
        typeof (this as any)[key]?.deleteMany === 'function'
      );
    }) as string[];

    const deleteOperations = modelKeys.map((model) =>
      (this as any)[model].deleteMany()
    );

    return this.$transaction(deleteOperations);
  }



  async transaction<T>(fn: (prisma: this) => Promise<T>): Promise<T> {
    return this.$transaction(async (prisma) => {
      return await fn(prisma as this);
    });
  }
}