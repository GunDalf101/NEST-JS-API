import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    UseGuards, 
    ParseIntPipe, 
    ForbiddenException 
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { CurrentUser } from '../auth/decorators/current-user.decorator';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  
  @ApiTags('users')
  @ApiBearerAuth()
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    // Only admin should be able to create users directly
    // Users should register through auth/register
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
      return this.usersService.create(createUserDto);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ status: 200, description: 'Return all users.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    findAll() {
      return this.usersService.findAll();
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user by id' })
    @ApiResponse({ status: 200, description: 'Return the user.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
      // Allow users to view their own profile or implement additional checks
      // For now, we'll allow viewing any user profile
      return this.usersService.findOne(id);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update user' })
    @ApiResponse({ status: 200, description: 'User has been successfully updated.' })
    @ApiResponse({ status: 400, description: 'Invalid input data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    update(
      @Param('id', ParseIntPipe) id: number, 
      @Body() updateUserDto: UpdateUserDto,
      @CurrentUser() user
    ) {
      // Check if user is updating their own profile
      if (user.id !== id) {
        throw new ForbiddenException('You can only update your own profile');
      }
      return this.usersService.update(id, updateUserDto);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete user' })
    @ApiResponse({ status: 200, description: 'User has been successfully deleted.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    remove(
      @Param('id', ParseIntPipe) id: number,
      @CurrentUser() user
    ) {
      // Check if user is deleting their own profile
      if (user.id !== id) {
        throw new ForbiddenException('You can only delete your own profile');
      }
      return this.usersService.remove(id);
    }
  }