import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { VehicleMapper } from '../../../application/mappers/vehicle.mapper';
import { Vehicle } from '../../../domain/entities/vehicle.entity';
import {
  IVehicleRepository,
  VehicleListQuery,
  VehicleListResult,
} from '../../../domain/interfaces/vehicle-repository.interface';
import { VehicleOrmEntity } from '../entities/vehicle.orm-entity';

const VEHICLE_SORT_FIELD_MAP: Record<VehicleListQuery['sort'], keyof VehicleOrmEntity> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  year: 'year',
};

@Injectable()
export class TypeOrmVehicleRepository implements IVehicleRepository {
  constructor(
    @InjectRepository(VehicleOrmEntity)
    private readonly repository: Repository<VehicleOrmEntity>,
  ) {}

  async findById(id: string): Promise<Vehicle | null> {
    const vehicle = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return vehicle ? VehicleMapper.toDomain(vehicle) : null;
  }

  async findAll(query: VehicleListQuery): Promise<VehicleListResult> {
    const safePage = Math.max(1, query.page);
    const safeLimit = Math.max(1, query.limit);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await this.repository.findAndCount({
      where: { deletedAt: IsNull() },
      order: { [VEHICLE_SORT_FIELD_MAP[query.sort]]: query.order.toUpperCase() as 'ASC' | 'DESC' },
      skip,
      take: safeLimit,
    });

    return {
      items: items.map((item) => VehicleMapper.toDomain(item)),
      total,
    };
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const normalized = licensePlate.trim().toUpperCase();
    const vehicle = await this.repository.findOne({
      where: { licensePlate: normalized, deletedAt: IsNull() },
    });

    return vehicle ? VehicleMapper.toDomain(vehicle) : null;
  }

  async findByChassis(chassis: string): Promise<Vehicle | null> {
    const normalized = chassis.trim().toUpperCase();
    const vehicle = await this.repository.findOne({
      where: { chassis: normalized, deletedAt: IsNull() },
    });

    return vehicle ? VehicleMapper.toDomain(vehicle) : null;
  }

  async findByRenavam(renavam: string): Promise<Vehicle | null> {
    const normalized = renavam.trim();
    const vehicle = await this.repository.findOne({
      where: { renavam: normalized, deletedAt: IsNull() },
    });

    return vehicle ? VehicleMapper.toDomain(vehicle) : null;
  }

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const ormEntity = VehicleMapper.toOrm(vehicle);
    const saved = await this.repository.save(ormEntity);
    return VehicleMapper.toDomain(saved);
  }

  async update(vehicle: Vehicle): Promise<Vehicle> {
    const ormEntity = VehicleMapper.toOrm(vehicle);
    const saved = await this.repository.save(ormEntity);
    return VehicleMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete({ id });
  }
}
