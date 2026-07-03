import { randomUUID } from 'node:crypto';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../../infrastructure/persistence/entities/user.orm-entity';

export class UserMapper {
  static toDomain(ormEntity: UserOrmEntity): User {
    return new User({
      id: ormEntity.id,
      nickname: ormEntity.nickname,
      name: ormEntity.name,
      email: ormEntity.email,
      passwordHash: ormEntity.passwordHash,
      createdBy: ormEntity.createdBy,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toOrm(domainEntity: User): UserOrmEntity {
    const ormEntity = new UserOrmEntity();

    ormEntity.id = domainEntity.id;
    ormEntity.nickname = domainEntity.nickname;
    ormEntity.name = domainEntity.name;
    ormEntity.email = domainEntity.email;
    ormEntity.passwordHash = domainEntity.passwordHash;
    ormEntity.createdBy = domainEntity.createdBy;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;

    return ormEntity;
  }

  static createDomainFromPrimitives(input: {
    id?: string;
    nickname: string;
    name: string;
    email: string;
    passwordHash: string;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): User {
    const now = new Date();

    return new User({
      id: input.id ?? randomUUID(),
      nickname: input.nickname,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      createdBy: input.createdBy,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
}
