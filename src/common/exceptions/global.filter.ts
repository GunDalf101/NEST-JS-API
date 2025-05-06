import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { BaseException } from './base.exception';
import { AppLogger } from '../services/logger.service';

/**
 * Global exception filter that handles all exceptions
 * thrown in the application and formats them into a consistent
 * response structure
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('GlobalExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details = null;
    let stack: string | undefined;

    if (exception instanceof BaseException) {
      const error = exception.getResponse() as any;
      status = exception.getStatus();
      message = error.message;
      code = error.code;
      details = error.details;
      stack = exception.stack;
      
      this.logger.warn(
        `${request.method} ${request.url} - ${status} ${code}: ${message}`,
        'BaseException'
      );
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const error = exception.getResponse() as any;
      message = error.message || exception.message;
      code = error.code || 'HTTP_ERROR';
      details = error.details || null;
      stack = exception.stack;
      
      this.logger.warn(
        `${request.method} ${request.url} - ${status} ${code}: ${message}`,
        'HttpException'
      );
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
      
      this.logger.error(
        `${request.method} ${request.url} - Unhandled error: ${message}`,
        stack
      );
    } else {
      this.logger.error(
        `${request.method} ${request.url} - Unknown exception type`,
        JSON.stringify(exception)
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}