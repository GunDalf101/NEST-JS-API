import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class TooManyRequestsException extends BaseException {
  constructor() {
    super(
      'Too many requests, please try again later',
      HttpStatus.TOO_MANY_REQUESTS,
      'TOO_MANY_REQUESTS'
    );
  }
}