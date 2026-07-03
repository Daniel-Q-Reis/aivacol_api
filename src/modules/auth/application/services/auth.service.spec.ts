import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { UserMapper } from '../../../users/application/mappers/user.mapper';
import { IUserRepository } from '../../../users/domain/interfaces/user-repository.interface';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByNickname: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    eventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    service = new AuthService(userRepository, jwtService, eventEmitter);
  });

  it('returns token and emits successful AUTH audit', async () => {
    const user = UserMapper.createDomainFromPrimitives({
      id: 'fe27dfbb-d66e-43cf-b4a8-5a41958a9761',
      nickname: 'aivacol',
      name: 'Aivacol',
      email: 'admin@aivacol.com',
      passwordHash: '$2b$12$0v8hUsAygH4FCw9B8PxeNOzqFDjstQa6xR8AOAz6N4WQxgQ01x9fW',
      createdBy: 'fe27dfbb-d66e-43cf-b4a8-5a41958a9761',
    });
    userRepository.findByNickname.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const response = await service.login({ nickname: ' AIVACOL ', password: 'secret' });

    expect(response).toEqual({ access_token: 'jwt-token' });
    expect(userRepository.findByNickname).toHaveBeenCalledWith('aivacol');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id, nickname: user.nickname }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({
        action: 'AUTH',
        metadata: expect.objectContaining({ outcome: 'LOGIN_SUCCESS' }),
      }),
    );
  });

  it('rejects missing user with stable INVALID_CREDENTIALS contract', async () => {
    userRepository.findByNickname.mockResolvedValue(null);

    await expect(service.login({ nickname: 'ghost', password: 'secret' })).rejects.toThrow(
      UnauthorizedException,
    );

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({ metadata: expect.objectContaining({ outcome: 'LOGIN_FAILED' }) }),
    );
  });

  it('rejects invalid password with same error surface to prevent account enumeration', async () => {
    const user = UserMapper.createDomainFromPrimitives({
      id: 'fe27dfbb-d66e-43cf-b4a8-5a41958a9761',
      nickname: 'aivacol',
      name: 'Aivacol',
      email: 'admin@aivacol.com',
      passwordHash: '$2b$12$0v8hUsAygH4FCw9B8PxeNOzqFDjstQa6xR8AOAz6N4WQxgQ01x9fW',
      createdBy: 'fe27dfbb-d66e-43cf-b4a8-5a41958a9761',
    });
    userRepository.findByNickname.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.login({ nickname: 'aivacol', password: 'bad' })).rejects.toMatchObject({
      response: expect.objectContaining({ code: ERROR_CATALOG.INVALID_CREDENTIALS.code }),
    });
  });
});
