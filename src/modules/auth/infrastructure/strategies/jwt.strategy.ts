import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getAuthConfig } from '../../../../config/auth.config';
import { JwtUserPayload } from '../../../../common/interfaces/authenticated-request.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const authConfig = getAuthConfig();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig.jwtSecret,
    });
  }

  validate(payload: Record<string, unknown>): JwtUserPayload {
    const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
    const userId = typeof payload.userId === 'string' ? payload.userId : sub;
    const nickname = typeof payload.nickname === 'string' ? payload.nickname : undefined;

    return {
      ...payload,
      sub,
      userId,
      nickname,
    };
  }
}
