import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

class TestException extends BaseException {
  constructor(message = 'Test error', statusCode = HttpStatus.BAD_REQUEST, errorCode = 'TEST_ERROR') {
    super(message, statusCode, errorCode);
  }
}

describe('BaseException', () => {
  it('should create exception with default values', () => {
    const exception = new TestException();
    
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.message).toBe('Test error');
    expect(exception.getError()).toBe('TEST_ERROR');
  });

  it('should create exception with custom values', () => {
    const message = 'Custom error';
    const status = HttpStatus.NOT_FOUND;
    const errorCode = 'CUSTOM_ERROR';
    
    const exception = new TestException(message, status, errorCode);
    
    expect(exception.getStatus()).toBe(status);
    expect(exception.message).toBe(message);
    expect(exception.getError()).toBe(errorCode);
  });

  it('should create proper response object', () => {
    const message = 'Custom error';
    const status = HttpStatus.NOT_FOUND;
    const errorCode = 'CUSTOM_ERROR';
    
    const exception = new TestException(message, status, errorCode);
    const response = exception.getResponse() as Record<string, any>;
    
    expect(response).toEqual({
      statusCode: status,
      message,
      error: errorCode
    });
  });
});