import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';
import { TokenExpiredException } from '../../common/exceptions/auth.exceptions';

@Injectable()
export class VerifyTokenMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.authService.verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof TokenExpiredException) {
        throw new TokenExpiredException();
      }
      next();
    }
  }
}