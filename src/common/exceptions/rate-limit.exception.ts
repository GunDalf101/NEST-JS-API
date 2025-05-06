import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class TooManyRequestsException extends BaseException {
  constructor(message = 'Too many requests, please try again later') {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'Too Many Requests');
  }
}