import { HttpStatus } from '@nestjs/common';
import {
  PrismaClientException,
  DatabaseException,
  UniqueConstraintException,
  RecordNotFoundException,
  ValidationException,
} from './prisma.exceptions';

describe('Prisma Exceptions', () => {
  describe('PrismaClientException', () => {
    it('should create with default values', () => {
      const exception = new PrismaClientException();
      
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.message).toBe('Database operation failed');
      expect(exception.getError()).toBe('Internal Server Error');
    });

    it('should create with custom message', () => {
      const message = 'Custom database error';
      const exception = new PrismaClientException(message);
      
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.message).toBe(message);
      expect(exception.getError()).toBe('Internal Server Error');
    });
  });

  describe('DatabaseException', () => {
    it('should create with default message', () => {
      const exception = new DatabaseException();
      
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.message).toBe('Database error occurred');
      expect(exception.getError()).toBe('Internal Server Error');
    });

    it('should create with custom message', () => {
      const message = 'Custom error occurred';
      const exception = new DatabaseException(message);
      
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.message).toBe(message);
      expect(exception.getError()).toBe('Internal Server Error');
    });
  });

  describe('UniqueConstraintException', () => {
    it('should create with field name', () => {
      const field = 'email';
      const exception = new UniqueConstraintException(field);
      
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.message).toBe('email already exists');
      expect(exception.getError()).toBe('Conflict');
    });
  });

  describe('RecordNotFoundException', () => {
    it('should create with entity and identifier', () => {
      const entity = 'User';
      const id = 123;
      const exception = new RecordNotFoundException(entity, id);
      
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.message).toBe('User with identifier 123 not found');
      expect(exception.getError()).toBe('Not Found');
    });

    it('should handle string identifiers', () => {
      const entity = 'Product';
      const id = 'ABC123';
      const exception = new RecordNotFoundException(entity, id);
      
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.message).toBe('Product with identifier ABC123 not found');
      expect(exception.getError()).toBe('Not Found');
    });
  });

  describe('ValidationException', () => {
    it('should create with default message', () => {
      const exception = new ValidationException();
      
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.message).toBe('Validation error');
      expect(exception.getError()).toBe('Bad Request');
    });

    it('should create with custom message', () => {
      const message = 'Invalid input data';
      const exception = new ValidationException(message);
      
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.message).toBe(message);
      expect(exception.getError()).toBe('Bad Request');
    });
  });
});