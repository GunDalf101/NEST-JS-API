import { Test, TestingModule } from '@nestjs/testing';
import { SecurityMiddleware } from './security.middleware';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

jest.mock('helmet', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

jest.mock('compression', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityMiddleware,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    middleware = module.get<SecurityMiddleware>(SecurityMiddleware);
  });

  describe('Security Headers', () => {
    let mockResponse: Partial<Response>;
    let mockRequest: Partial<Request>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockResponse = {
        setHeader: jest.fn(),
        headersSent: false,
        sendStatus: jest.fn(),
      };

      mockRequest = {
        method: 'GET',
        headers: {},
      };

      mockNext = jest.fn();
    });

    it('should set security headers', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Security-Policy', "default-src 'self'");
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    });

    it('should handle CORS for allowed origin', () => {
      mockRequest.headers.origin = 'http://localhost:3000';
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Authorization,Content-Type');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
    });

    it('should not set CORS headers for disallowed origin', () => {
      mockRequest.headers.origin = 'http://malicious-site.com';
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://malicious-site.com');
    });

    it('should handle OPTIONS requests', () => {
      mockRequest.method = 'OPTIONS';
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next for non-OPTIONS requests', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});