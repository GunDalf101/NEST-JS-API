import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required().min(32),
        JWT_REFRESH_SECRET: Joi.string().required().min(32),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        REDIS_ENABLED: Joi.boolean().default(false),
        REDIS_URL: Joi.string().when('REDIS_ENABLED', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        RATE_LIMIT_POINTS: Joi.number().default(100),
        RATE_LIMIT_DURATION: Joi.number().default(60),
        RATE_LIMIT_BLOCK_DURATION: Joi.number().default(60),
        ALLOWED_ORIGINS: Joi.string().default('*'),
      }),
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}