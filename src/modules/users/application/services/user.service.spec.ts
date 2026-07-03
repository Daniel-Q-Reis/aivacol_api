import { EventEmitter2 } from '@nestjs/event-emitter';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { UserMapper } from '../mappers/user.mapper';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<IUserRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByNickname: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    service = new UserService(repository, eventEmitter);
  });

  it('findAll maps users and emits READ audit', async () => {
    repository.findAll.mockResolvedValue([
      UserMapper.createDomainFromPrimitives({
        id: '4d59a4dd-ecf8-4b4d-8d63-cf17f465dd8e',
        nickname: 'aivacol',
        name: 'Aivacol Admin',
        email: 'admin@aivacol.com',
        passwordHash: '$2b$12$0v8hUsAygH4FCw9B8PxeNOzqFDjstQa6xR8AOAz6N4WQxgQ01x9fW',
        createdBy: '4d59a4dd-ecf8-4b4d-8d63-cf17f465dd8e',
      }),
    ]);

    const result = await service.findAll({ userId: 'u1', correlationId: 'cid-1' });

    expect(result).toHaveLength(1);
    // Regression risk: response must not leak credential hash even if repository intentionally fetches it.
    expect(result[0]).not.toHaveProperty('passwordHash');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({ action: 'READ', entity: 'USER' }),
    );
  });

  it('findById returns user and throws USER_NOT_FOUND when absent', async () => {
    const user = UserMapper.createDomainFromPrimitives({
      id: '4d59a4dd-ecf8-4b4d-8d63-cf17f465dd8e',
      nickname: 'aivacol',
      name: 'Aivacol Admin',
      email: 'admin@aivacol.com',
      passwordHash: '$2b$12$0v8hUsAygH4FCw9B8PxeNOzqFDjstQa6xR8AOAz6N4WQxgQ01x9fW',
      createdBy: '4d59a4dd-ecf8-4b4d-8d63-cf17f465dd8e',
    });

    repository.findById.mockResolvedValue(user);
    await expect(service.findById(user.id)).resolves.toMatchObject({ id: user.id });

    repository.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toMatchObject({
      code: ERROR_CATALOG.USER_NOT_FOUND.code,
    });
  });
});
