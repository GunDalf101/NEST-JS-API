import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly compressionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
  private readonly helmetMiddleware: (req: Request, res: Response, next: NextFunction) => void;

  constructor(private readonly configService: ConfigService) {
    this.compressionMiddleware = compression();
    this.helmetMiddleware = helmet();
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply Helmet middleware first
    this.helmetMiddleware(req, res, (err: any) => {
      if (err) {
        next(err);
        return;
      }

      // Set additional security headers
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'self'");
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');

      // CORS headers
      const allowedOrigin = this.configService.get('CORS_ORIGIN', 'http://localhost:3000');
      const origin = req.headers.origin;
      
      if (origin && origin === allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      // Apply compression last
      if (!res.headersSent) {
        this.compressionMiddleware(req, res, next);
      } else {
        next();
      }
    });
  }
}