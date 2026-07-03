import { Repository } from 'typeorm';
import { UserMapper } from '../../../application/mappers/user.mapper';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { TypeOrmUserRepository } from './typeorm-user.repository';

describe('TypeOrmUserRepository', () => {
  const makeDomainUser = () =>
    UserMapper.createDomainFromPrimitives({
      id: '7db5cb3b-950c-4af5-8eb3-158f8cf3737b',
      nickname: 'aivacol',
      name: 'Aivacol Admin',
      email: 'admin@aivacol.com',
      passwordHash: '$2b$12$0v8hUsAygH4FCw9B8PxeNOzqFDjstQa6xR8AOAz6N4WQxgQ01x9fW',
      createdBy: '7db5cb3b-950c-4af5-8eb3-158f8cf3737b',
    });

  const buildQb = () => {
    const qb: any = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };
    return qb;
  };

  let ormRepository: jest.Mocked<Repository<UserOrmEntity>>;
  let repository: TypeOrmUserRepository;

  beforeEach(() => {
    ormRepository = {
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserOrmEntity>>;

    repository = new TypeOrmUserRepository(ormRepository);
  });

  it('findById retrieves active user with password hash', async () => {
    const qb = buildQb();
    qb.getOne.mockResolvedValue(UserMapper.toOrm(makeDomainUser()));
    ormRepository.createQueryBuilder.mockReturnValue(qb);

    const user = await repository.findById('7db5cb3b-950c-4af5-8eb3-158f8cf3737b');

    expect(user?.id).toBe('7db5cb3b-950c-4af5-8eb3-158f8cf3737b');
    expect(qb.addSelect).toHaveBeenCalledWith('user.passwordHash');
  });

  it('findByNickname normalizes case and trims input', async () => {
    const qb = buildQb();
    qb.getOne.mockResolvedValue(UserMapper.toOrm(makeDomainUser()));
    ormRepository.createQueryBuilder.mockReturnValue(qb);

    await repository.findByNickname(' AIVACOL ');

    expect(qb.where).toHaveBeenCalledWith('LOWER(user.nickname) = :nickname', {
      nickname: 'aivacol',
    });
  });

  it('findAll returns sorted active users', async () => {
    const qb = buildQb();
    qb.getMany.mockResolvedValue([UserMapper.toOrm(makeDomainUser())]);
    ormRepository.createQueryBuilder.mockReturnValue(qb);

    const users = await repository.findAll();

    expect(users).toHaveLength(1);
    expect(qb.orderBy).toHaveBeenCalledWith('user.nickname', 'ASC');
  });

  it('create/update/save and softDelete delegates to ORM repository', async () => {
    const user = makeDomainUser();
    ormRepository.save.mockResolvedValue({} as never);
    ormRepository.softDelete.mockResolvedValue({} as never);

    await repository.create(user);
    await repository.update(user);
    await repository.delete(user.id);

    expect(ormRepository.save).toHaveBeenCalledTimes(2);
    expect(ormRepository.softDelete).toHaveBeenCalledWith({ id: user.id });
  });
});
