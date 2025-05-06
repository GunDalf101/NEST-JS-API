import { HttpStatus } from '@nestjs/common';
import {
  InvalidCredentialsException,
  TokenExpiredException,
  TokenInvalidException,
  UnauthorizedException,
} from './auth.exceptions';

describe('Auth Exceptions', () => {
  describe('InvalidCredentialsException', () => {
    it('should create with default message', () => {
      const exception = new InvalidCredentialsException();
      
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(exception.message).toBe('Invalid email or password');
      expect(exception.getError()).toBe('Unauthorized');
    });

    it('should create with custom message', () => {
      const message = 'Custom invalid credentials message';
      const exception = new InvalidCredentialsException(message);
      
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(exception.message).toBe(message);
      expect(exception.getError()).toBe('Unauthorized');
    });
  });

  describe('TokenExpiredException', () => {
    it('should create with default message', () => {
      const exception = new TokenExpiredException();
      
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(exception.message).toBe('Token has expired');
      expect(exception.getError()).toBe('Unauthorized');
    });

    it('should create with custom message', () => {
      const message = 'Custom token expired message';
      const exception = new TokenExpiredException(message);
      
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(exception.message).toBe(message);
      expect(exception.getError()).toBe('Unauthorized');
    });
  });

  describe('TokenInvalidException', () => {
    it('should create with default message', () => {
      const exception = new TokenInvalidException();
      
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(exception.message).toBe('Invalid token');
      expect(exception.getError()).toBe('Unauthorized');
    });

    it('should create with custom message', () => {
      const message = 'Custom invalid token message';
      const exception = new TokenInvalidException(message);
      
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(exception.message).toBe(message);
      expect(exception.getError()).toBe('Unauthorized');
    });
  });

  describe('UnauthorizedException', () => {
    it('should create with default message', () => {
      const exception = new UnauthorizedException();
      
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(exception.message).toBe('Unauthorized access');
      expect(exception.getError()).toBe('Unauthorized');
    });

    it('should create with custom message', () => {
      const message = 'Custom unauthorized message';
      const exception = new UnauthorizedException(message);
      
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(exception.message).toBe(message);
      expect(exception.getError()).toBe('Unauthorized');
    });
  });
});