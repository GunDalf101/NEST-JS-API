import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Req, 
  Query, 
  ParseIntPipe, 
  ParseArrayPipe, 
  HttpStatus, 
  HttpCode
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoQueryDto } from './dto/todo-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiParam, 
  ApiBody, 
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AppLogger } from '../common/services/logger.service';

/**
 * Controller for managing todo items
 */
@ApiTags('todos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext('TodosController');
  }

  /**
   * Creates a new todo item for the authenticated user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new todo', description: 'Creates a new todo item for the authenticated user' })
  @ApiBody({ type: CreateTodoDto, description: 'Todo item data' })
  @ApiCreatedResponse({ description: 'The todo has been successfully created' })
  @ApiBadRequestResponse({ description: 'Invalid data provided' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  async create(@Body() createTodoDto: CreateTodoDto, @CurrentUser() userId: number) {
    this.logger.log(`Creating todo for user ${userId}`);
    return this.todosService.create(createTodoDto, userId);
  }

  /**
   * Retrieves all todos for the authenticated user with optional filtering
   */
  @Get()
  @ApiOperation({ summary: 'Find all todos', description: 'Retrieves all todos for the authenticated user with optional filtering' })
  @ApiOkResponse({ description: 'Retrieved todos successfully' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  async findAll(@Query() query: TodoQueryDto, @CurrentUser() userId: number) {
    this.logger.log(`Finding todos for user ${userId} with query: ${JSON.stringify(query)}`);
    return this.todosService.findAll(query, userId);
  }

  /**
   * Retrieves total count of todos grouped by status
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Get todo statistics', description: 'Retrieves total count of todos grouped by status' })
  @ApiOkResponse({ description: 'Retrieved statistics successfully' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  async getStatistics(@CurrentUser() userId: number) {
    this.logger.log(`Getting statistics for user ${userId}`);
    return this.todosService.getStatistics(userId);
  }

  /**
   * Retrieves a specific todo by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Find todo by ID', description: 'Retrieves a specific todo by ID' })
  @ApiParam({ name: 'id', description: 'Todo ID', type: Number })
  @ApiOkResponse({ description: 'Retrieved todo successfully' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiNotFoundResponse({ description: 'Todo not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number, 
    @CurrentUser() userId: number
  ) {
    this.logger.log(`Finding todo ${id} for user ${userId}`);
    return this.todosService.findOne(id, userId);
  }

  /**
   * Updates a specific todo by ID
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update todo', description: 'Updates a specific todo by ID' })
  @ApiParam({ name: 'id', description: 'Todo ID', type: Number })
  @ApiBody({ type: UpdateTodoDto, description: 'Updated todo data' })
  @ApiOkResponse({ description: 'Todo updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid data provided' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiNotFoundResponse({ description: 'Todo not found' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateTodoDto: UpdateTodoDto,
    @CurrentUser() userId: number
  ) {
    this.logger.log(`Updating todo ${id} for user ${userId}`);
    return this.todosService.update(id, updateTodoDto, userId);
  }

  /**
   * Updates multiple todos at once
   */
  @Patch('batch')
  @ApiOperation({ summary: 'Batch update todos', description: 'Updates multiple todos at once' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Array of todo IDs to update'
        },
        data: {
          type: 'object',
          properties: {
            completed: { type: 'boolean', description: 'Completion status' }
          }
        }
      }
    }
  })
  @ApiOkResponse({ description: 'Todos updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid data provided' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  async updateMany(
    @Body('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @Body('data') updateData: UpdateTodoDto,
    @CurrentUser() userId: number
  ) {
    this.logger.log(`Batch updating todos for user ${userId}: ${ids.join(', ')}`);
    return this.todosService.updateMany(ids, updateData, userId);
  }

  /**
   * Deletes a specific todo by ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete todo', description: 'Deletes a specific todo by ID' })
  @ApiParam({ name: 'id', description: 'Todo ID', type: Number })
  @ApiNoContentResponse({ description: 'Todo deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiNotFoundResponse({ description: 'Todo not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() userId: number
  ) {
    this.logger.log(`Deleting todo ${id} for user ${userId}`);
    return this.todosService.remove(id, userId);
  }

  /**
   * Deletes multiple todos at once
   */
  @Delete('batch')
  @ApiOperation({ summary: 'Batch delete todos', description: 'Deletes multiple todos at once' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Array of todo IDs to delete'
        }
      }
    }
  })
  @ApiOkResponse({ description: 'Todos deleted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid data provided' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  async deleteMany(
    @Body('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @CurrentUser() userId: number
  ) {
    this.logger.log(`Batch deleting todos for user ${userId}: ${ids.join(', ')}`);
    return this.todosService.deleteMany(ids, userId);
  }
}