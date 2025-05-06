import { IsOptional, IsBoolean, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TodoQueryDto {
  @ApiPropertyOptional({ description: 'Search term for title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by completion status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  completed?: boolean;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page? = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  limit? = 10;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'title', 'completed'] })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'title', 'completed'])
  sortBy? = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}