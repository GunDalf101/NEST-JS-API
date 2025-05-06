import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/exceptions/global.filter';
import helmet from 'helmet';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from './common/services/logger.service';

async function bootstrap() {
  // Create logger instance for application bootstrap
  const logger = new Logger('Bootstrap');
  
  try {
    // Create the NestJS application with explicit logger
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    const configService = app.get(ConfigService);
    const nodeEnv = configService.get('NODE_ENV', 'development');
    const port = configService.get('PORT', 3000);
    
    // Global exception filter
    const appLogger = await app.resolve(AppLogger);
    appLogger.setContext('GlobalExceptionFilter');
    app.useGlobalFilters(new GlobalExceptionFilter(appLogger));

    // Validation pipe with strict configuration
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        // Stop application from starting if there's a validation error
        forbidUnknownValues: true,
        disableErrorMessages: nodeEnv === 'production',
      }),
    );

    // Security middleware
    app.use(helmet());
    
    // Configure CORS based on environment
    const corsOrigins = configService.get<string>('ALLOWED_ORIGINS');
    const corsOptions = {
      origin: corsOrigins ? corsOrigins.split(',') : '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
    };
    app.enableCors(corsOptions);
    logger.log(`CORS configured with origins: ${corsOptions.origin}`);

    // Compression for all responses
    app.use(compression());

    // Prefix all routes with /api
    app.setGlobalPrefix('api');

    // Swagger API documentation
    if (nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Todo API')
        .setDescription('The Todo API provides endpoints for managing todos and user authentication')
        .setVersion('1.0')
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management endpoints')
        .addTag('todos', 'Todo management endpoints')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'Authorization',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth',
        )
        .build();
        
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });
      logger.log('Swagger documentation is available at /api/docs');
    }

    // Start the application
    await app.listen(port);
    logger.log(`Application is running in ${nodeEnv} mode on: http://localhost:${port}/api`);
  } catch (error) {
    logger.error(`Error during application bootstrap: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap().catch(err => {
  const logger = new Logger('Bootstrap');
  logger.error(`Fatal error during application startup: ${err.message}`, err.stack);
  process.exit(1);
});