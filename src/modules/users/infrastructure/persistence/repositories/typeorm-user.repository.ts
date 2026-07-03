import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/interfaces/user-repository.interface';
import { UserMapper } from '../../../application/mappers/user.mapper';
import { UserOrmEntity } from '../entities/user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    // password_hash is opt-in (`select: false`) and only fetched in auth-oriented repository paths.
    const user = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.id = :id', { id })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    return user ? UserMapper.toDomain(user) : null;
  }

  async findByNickname(nickname: string): Promise<User | null> {
    const normalizedNickname = nickname.trim().toLowerCase();

    // Normalized lookup keeps authentication deterministic regardless of input casing.
    const user = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('LOWER(user.nickname) = :nickname', { nickname: normalizedNickname })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    return user ? UserMapper.toDomain(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.deleted_at IS NULL')
      .orderBy('user.nickname', 'ASC')
      .getMany();

    return users.map((user) => UserMapper.toDomain(user));
  }

  async create(user: User): Promise<User> {
    const ormEntity = UserMapper.toOrm(user);
    await this.repository.save(ormEntity);
    return user;
  }

  async update(user: User): Promise<User> {
    const ormEntity = UserMapper.toOrm(user);
    await this.repository.save(ormEntity);
    return user;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete({ id });
  }
}
