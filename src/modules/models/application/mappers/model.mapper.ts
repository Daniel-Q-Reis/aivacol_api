import { randomUUID } from 'node:crypto';
import { Model } from '../../domain/entities/model.entity';
import { ModelOrmEntity } from '../../infrastructure/persistence/entities/model.orm-entity';

export class ModelMapper {
  static toDomain(ormEntity: ModelOrmEntity): Model {
    return new Model({
      id: ormEntity.id,
      name: ormEntity.name,
      brandId: ormEntity.brandId,
      createdBy: ormEntity.createdBy,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toOrm(domainEntity: Model): ModelOrmEntity {
    const ormEntity = new ModelOrmEntity();

    ormEntity.id = domainEntity.id;
    ormEntity.name = domainEntity.name;
    ormEntity.brandId = domainEntity.brandId;
    ormEntity.createdBy = domainEntity.createdBy;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;

    return ormEntity;
  }

  static createDomainFromPrimitives(input: {
    id?: string;
    name: string;
    brandId: string;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Model {
    const now = new Date();

    return new Model({
      id: input.id ?? randomUUID(),
      name: input.name,
      brandId: input.brandId,
      createdBy: input.createdBy,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
}
