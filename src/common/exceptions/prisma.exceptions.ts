import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class PrismaClientException extends BaseException {
  constructor(message = 'Database operation failed') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
}

export class DatabaseException extends BaseException {
  constructor(message = 'Database error occurred') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
}

export class UniqueConstraintException extends BaseException {
  constructor(field: string) {
    super(
      `${field} already exists`,
      HttpStatus.CONFLICT,
      'Conflict'
    );
  }
}

export class RecordNotFoundException extends BaseException {
  constructor(entity: string, identifier: string | number) {
    super(
      `${entity} with identifier ${identifier} not found`,
      HttpStatus.NOT_FOUND,
      'Not Found'
    );
  }
}

export class ValidationException extends BaseException {
  constructor(message = 'Validation error') {
    super(message, HttpStatus.BAD_REQUEST, 'Bad Request');
  }
}