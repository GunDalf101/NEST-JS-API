import { Test } from '@nestjs/testing';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(async () => {
    filter = new HttpExceptionFilter();
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });
});