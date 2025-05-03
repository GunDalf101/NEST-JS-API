import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.configService.get('JWT_SECRET'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    // Store refresh token in Redis if available
    if (this.redisService.isEnabled()) {
      await this.redisService.set(
        `refresh_token:${user.id}`,
        refreshToken,
        7 * 24 * 60 * 60, // 7 days in seconds
      );
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // If Redis is enabled, check if the token is in Redis
      if (this.redisService.isEnabled()) {
        const storedToken = await this.redisService.get(`refresh_token:${payload.sub}`);
        if (storedToken !== token) {
          throw new UnauthorizedException('Invalid refresh token');
        }
      }

      // Generate new tokens
      const newPayload = { email: payload.email, sub: payload.sub };
      
      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
        secret: this.configService.get('JWT_SECRET'),
      });

      const refreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Update refresh token in Redis if available
      if (this.redisService.isEnabled()) {
        await this.redisService.set(
          `refresh_token:${payload.sub}`,
          refreshToken,
          7 * 24 * 60 * 60, // 7 days in seconds
        );
      }

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    // Remove refresh token from Redis if available
    if (this.redisService.isEnabled()) {
      await this.redisService.del(`refresh_token:${userId}`);
    }
    return { success: true };
  }
}