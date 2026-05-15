import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserEntity } from '../storage/storage.types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
