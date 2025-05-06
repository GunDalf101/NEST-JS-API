import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class InvalidCredentialsException extends BaseException {
  constructor(message = 'Invalid email or password') {
    super(message, HttpStatus.UNAUTHORIZED, 'Unauthorized');
  }
}

export class TokenExpiredException extends BaseException {
  constructor(message = 'Token has expired') {
    super(message, HttpStatus.UNAUTHORIZED, 'Unauthorized');
  }
}

export class TokenInvalidException extends BaseException {
  constructor(message = 'Invalid token') {
    super(message, HttpStatus.UNAUTHORIZED, 'Unauthorized');
  }
}

export class UnauthorizedException extends BaseException {
  constructor(message = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED, 'Unauthorized');
  }
}