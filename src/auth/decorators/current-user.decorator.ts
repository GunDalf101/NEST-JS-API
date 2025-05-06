import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      return request?.user;
    } catch (error) {
      return undefined;
    }
  },
);