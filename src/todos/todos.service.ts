import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoQueryDto } from './dto/todo-query.dto';
import { UnauthorizedException } from '../common/exceptions/auth.exceptions';
import { RecordNotFoundException } from '../common/exceptions/prisma.exceptions';

@Injectable()
export class TodosService {
    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
    ) { }

    async create(createTodoDto: CreateTodoDto, userId: number) {
        const todo = await this.prisma.todo.create({
            data: {
                ...createTodoDto,
                userId,
            },
        });

        // Invalidate cache
        if (this.redisService.isEnabled()) {
            await this.redisService.del(`todos:${userId}:*`);
            await this.redisService.del(`todos:stats:${userId}`);
        }

        return todo;
    }

    async findAll(query: TodoQueryDto, userId: number) {
        const { search, completed, page, limit, sortBy, sortOrder } = query;
        const currentPage = page ?? 1;
        const currentLimit = limit ?? 10;
        const skip = (currentPage - 1) * currentLimit;


        // Try to get from cache first
        const cacheKey = `todos:${userId}:${JSON.stringify(query)}`;
        if (this.redisService.isEnabled()) {
            const cachedData = await this.redisService.get(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
        }

        // Build where clause
        const where: any = { userId };

        if (completed !== undefined) {
            where.completed = completed;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }


        const orderField = sortBy ?? 'createdAt';
        const orderDirection = sortOrder ?? 'desc';

        
        // Execute query
        const [todos, total] = await Promise.all([
            this.prisma.todo.findMany({
                where,
                skip,
                take: currentLimit,
                orderBy: { [orderField]: orderDirection },
            }),
            this.prisma.todo.count({ where }),
        ]);

        const result = {
            data: todos,
            meta: {
                total,
                page: currentPage,
                limit: currentLimit,
                totalPages: Math.ceil(total / currentLimit),
            },
        };

        // Cache results
        if (this.redisService.isEnabled()) {
            await this.redisService.set(cacheKey, JSON.stringify(result), 60 * 5); // Cache for 5 minutes
        }

        return result;
    }

    async findOne(id: number, userId: number) {
        const todo = await this.prisma.todo.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!todo) {
            throw new RecordNotFoundException('Todo', id);
        }

        return todo;
    }

    async update(id: number, updateTodoDto: UpdateTodoDto, userId: number) {
        try {
            // First check if todo exists and user owns it
            await this.findOne(id, userId);

            const todo = await this.prisma.todo.update({
                where: {
                    id,
                    userId,
                },
                data: updateTodoDto,
            });

            // Invalidate cache
            if (this.redisService.isEnabled()) {
                await this.redisService.del(`todos:${userId}:*`);
                await this.redisService.del(`todos:stats:${userId}`);
            }

            return todo;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new RecordNotFoundException('Todo', id);
            }
            throw error;
        }
    }

    async remove(id: number, userId: number) {
        try {
            // First check if todo exists and user owns it
            await this.findOne(id, userId);

            await this.prisma.todo.delete({
                where: {
                    id,
                    userId,
                },
            });

            // Invalidate cache
            if (this.redisService.isEnabled()) {
                await this.redisService.del(`todos:${userId}:*`);
                await this.redisService.del(`todos:stats:${userId}`);
            }

            return { success: true };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new RecordNotFoundException('Todo', id);
            }
            throw error;
        }
    }

    async getStatistics(userId: number) {
        // Try to get from cache first
        const cacheKey = `todos:stats:${userId}`;
        if (this.redisService.isEnabled()) {
            const cachedData = await this.redisService.get(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
        }

        const [total, completed, pending] = await Promise.all([
            this.prisma.todo.count({ where: { userId } }),
            this.prisma.todo.count({ where: { userId, completed: true } }),
            this.prisma.todo.count({ where: { userId, completed: false } }),
        ]);

        const result = {
            total,
            completed,
            pending,
            completionRate: total > 0 ? (completed / total) * 100 : 0,
        };

        // Cache results
        if (this.redisService.isEnabled()) {
            await this.redisService.set(cacheKey, JSON.stringify(result), 60 * 5); // Cache for 5 minutes
        }

        return result;
    }

    async updateMany(ids: number[], data: UpdateTodoDto, userId: number) {
        return await this.prisma.$transaction(async (tx) => {
            // First check if all todos exist and user owns them
            const todos = await tx.todo.findMany({
                where: {
                    id: { in: ids },
                    userId,
                },
                select: {
                    id: true,
                },
            });

            const foundIds = todos.map((todo) => todo.id);
            const missingIds = ids.filter((id) => !foundIds.includes(id));

            if (missingIds.length > 0) {
                throw new RecordNotFoundException('Todo', missingIds[0]);
            }

            const result = await tx.todo.updateMany({
                where: {
                    id: { in: ids },
                    userId,
                },
                data,
            });

            // Invalidate cache
            if (this.redisService.isEnabled()) {
                await this.redisService.del(`todos:${userId}:*`);
                await this.redisService.del(`todos:stats:${userId}`);
            }

            return { count: result.count };
        });
    }

    async deleteMany(ids: number[], userId: number) {
        return await this.prisma.$transaction(async (tx) => {
            // First check if all todos exist and user owns them
            const todos = await tx.todo.findMany({
                where: {
                    id: { in: ids },
                    userId,
                },
                select: {
                    id: true,
                },
            });

            const foundIds = todos.map((todo) => todo.id);
            const missingIds = ids.filter((id) => !foundIds.includes(id));

            if (missingIds.length > 0) {
                throw new RecordNotFoundException('Todo', missingIds[0]);
            }

            const result = await tx.todo.deleteMany({
                where: {
                    id: { in: ids },
                    userId,
                },
            });

            // Invalidate cache
            if (this.redisService.isEnabled()) {
                await this.redisService.del(`todos:${userId}:*`);
                await this.redisService.del(`todos:stats:${userId}`);
            }

            return { count: result.count };
        });
    }
}