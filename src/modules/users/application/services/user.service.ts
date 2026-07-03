import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EntityNotFoundException } from '../../../../common/domain/exceptions/entity-not-found.exception';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/interfaces/user-repository.interface';
import { UserResponseDto } from '../dtos/user-response.dto';

interface ServiceContext {
  userId?: string;
  correlationId?: string;
}

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(context?: ServiceContext): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();

    this.emitAudit(undefined, {
      userId: context?.userId,
      correlationId: context?.correlationId,
      metadata: { operation: 'FIND_ALL' },
    });

    return users.map((user) => this.toResponse(user));
  }

  async findById(id: string, context?: ServiceContext): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException({
        entityName: 'User',
        identifier: id,
        code: ERROR_CATALOG.USER_NOT_FOUND.code,
      });
    }

    this.emitAudit(id, {
      userId: context?.userId,
      correlationId: context?.correlationId,
      metadata: { operation: 'FIND_BY_ID' },
    });

    return this.toResponse(user);
  }

  private toResponse(user: {
    id: string;
    nickname: string;
    name: string;
    email: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponseDto {
    // passwordHash intentionally never crosses presentation boundary.
    return {
      id: user.id,
      nickname: user.nickname,
      name: user.name,
      email: user.email,
      createdBy: user.createdBy,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private emitAudit(
    entityId: string | undefined,
    payload: {
      userId?: string;
      correlationId?: string;
      metadata?: Record<string, unknown>;
    },
  ): void {
    this.eventEmitter.emit('audit.service_interaction', {
      action: 'READ',
      entity: 'USER',
      entityId,
      userId: payload.userId,
      metadata: {
        correlationId: payload.correlationId,
        ...payload.metadata,
      },
      timestamp: new Date(),
    });
  }
}
