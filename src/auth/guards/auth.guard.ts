import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { TokenExpiredException, TokenInvalidException } from '../../common/exceptions/auth.exceptions';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new TokenInvalidException();
    }

    const token = authHeader.split(' ')[1];
    const payload = await this.authService.verifyToken(token);
    request.user = payload;
    return true;
  }
}