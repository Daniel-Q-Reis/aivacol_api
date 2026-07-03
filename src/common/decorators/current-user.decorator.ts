import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  JwtUserPayload,
} from '../interfaces/authenticated-request.interface';

export const CurrentUser = createParamDecorator(
  (field: keyof JwtUserPayload | undefined, ctx: ExecutionContext): JwtUserPayload | unknown => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user ?? {};

    if (!field) {
      return user;
    }

    return user[field];
  },
);
