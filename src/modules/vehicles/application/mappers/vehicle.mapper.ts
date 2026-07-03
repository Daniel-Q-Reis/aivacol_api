import { randomUUID } from 'node:crypto';
import { Chassis } from '../../../../common/domain/value-objects/chassis.vo';
import { LicensePlate } from '../../../../common/domain/value-objects/license-plate.vo';
import { Renavam } from '../../../../common/domain/value-objects/renavam.vo';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleOrmEntity } from '../../infrastructure/persistence/entities/vehicle.orm-entity';

export class VehicleMapper {
  static toDomain(ormEntity: VehicleOrmEntity): Vehicle {
    return new Vehicle({
      id: ormEntity.id,
      licensePlate: LicensePlate.create(ormEntity.licensePlate),
      chassis: Chassis.create(ormEntity.chassis),
      renavam: Renavam.create(ormEntity.renavam),
      year: ormEntity.year,
      modelId: ormEntity.modelId,
      createdBy: ormEntity.createdBy,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toOrm(domainEntity: Vehicle): VehicleOrmEntity {
    const primitives = domainEntity.toPrimitives();
    const ormEntity = new VehicleOrmEntity();

    ormEntity.id = primitives.id;
    ormEntity.licensePlate = primitives.licensePlate;
    ormEntity.chassis = primitives.chassis;
    ormEntity.renavam = primitives.renavam;
    ormEntity.year = primitives.year;
    ormEntity.modelId = primitives.modelId;
    ormEntity.createdBy = primitives.createdBy;
    ormEntity.createdAt = primitives.createdAt;
    ormEntity.updatedAt = primitives.updatedAt;

    return ormEntity;
  }

  static createDomainFromPrimitives(input: {
    id?: string;
    licensePlate: string;
    chassis: string;
    renavam: string;
    year: number;
    modelId: string;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Vehicle {
    const now = new Date();

    return new Vehicle({
      id: input.id ?? randomUUID(),
      licensePlate: LicensePlate.create(input.licensePlate),
      chassis: Chassis.create(input.chassis),
      renavam: Renavam.create(input.renavam),
      year: input.year,
      modelId: input.modelId,
      createdBy: input.createdBy,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }
}
