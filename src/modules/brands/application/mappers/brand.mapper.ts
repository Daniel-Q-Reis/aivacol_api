import { randomUUID } from 'node:crypto';
import { Brand } from '../../domain/entities/brand.entity';
import { BrandOrmEntity } from '../../infrastructure/persistence/entities/brand.orm-entity';

export class BrandMapper {
  static toDomain(ormEntity: BrandOrmEntity): Brand {
    return new Brand({
      id: ormEntity.id,
      name: ormEntity.name,
      createdBy: ormEntity.createdBy,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toOrm(domainEntity: Brand): BrandOrmEntity {
    const ormEntity = new BrandOrmEntity();

    ormEntity.id = domainEntity.id;
    ormEntity.name = domainEntity.name;
    ormEntity.createdBy = domainEntity.createdBy;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;

    return ormEntity;
  }

  static createDomainFromPrimitives(input: {
    id?: string;
    name: string;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Brand {
    const now = new Date();

    return new Brand({
      id: input.id ?? randomUUID(),
      name: input.name,
      createdBy: input.createdBy,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
}
