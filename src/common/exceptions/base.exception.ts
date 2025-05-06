import { HttpException } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(message: string, statusCode: number, errorCode: string) {
    super(
      {
        statusCode,
        message,
        error: errorCode,
      },
      statusCode
    );
  }

  public getError(): string {
    const response = this.getResponse() as Record<string, any>;
    return response.error;
  }
}