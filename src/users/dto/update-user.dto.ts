import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'User display name', minLength: 2, maxLength: 50 })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: 'User password - must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long',
    minLength: 8
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  )
  password?: string;
}