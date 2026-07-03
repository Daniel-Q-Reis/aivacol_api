import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../users/domain/interfaces/user-repository.interface';
import { LoginDto } from '../dtos/login.dto';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';

interface AuthTokenResponse {
  access_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const nickname = dto.nickname.trim().toLowerCase();
    const user = await this.userRepository.findByNickname(nickname);

    if (!user) {
      this.emitAuthAudit('LOGIN_FAILED', undefined, { nickname });
      throw this.invalidCredentials();
    }

    // We keep the same error response for user-not-found and bad-password to reduce credential enumeration vectors.
    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      this.emitAuthAudit('LOGIN_FAILED', user.id, { nickname: user.nickname });
      throw this.invalidCredentials();
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      userId: user.id,
      nickname: user.nickname,
    });

    this.emitAuthAudit('LOGIN_SUCCESS', user.id, { nickname: user.nickname });

    return {
      access_token: token,
    };
  }

  private invalidCredentials(): UnauthorizedException {
    const error = ERROR_CATALOG.INVALID_CREDENTIALS;
    return new UnauthorizedException({
      code: error.code,
      message: error.message,
    });
  }

  private emitAuthAudit(
    outcome: 'LOGIN_SUCCESS' | 'LOGIN_FAILED',
    userId?: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.eventEmitter.emit('audit.service_interaction', {
      action: 'AUTH',
      entity: 'AUTH',
      entityId: userId,
      userId,
      metadata: {
        outcome,
        ...metadata,
      },
      timestamp: new Date(),
    });
  }
}
