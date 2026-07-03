import { Vehicle } from '../entities/vehicle.entity';

export const VEHICLE_REPOSITORY = Symbol('VEHICLE_REPOSITORY');

export interface VehicleListQuery {
  page: number;
  limit: number;
  sort: 'createdAt' | 'updatedAt' | 'year';
  order: 'asc' | 'desc';
}

export interface VehicleListResult {
  items: Vehicle[];
  total: number;
}

export interface IVehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findAll(query: VehicleListQuery): Promise<VehicleListResult>;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  findByChassis(chassis: string): Promise<Vehicle | null>;
  findByRenavam(renavam: string): Promise<Vehicle | null>;
  create(vehicle: Vehicle): Promise<Vehicle>;
  update(vehicle: Vehicle): Promise<Vehicle>;
  delete(id: string): Promise<void>;
}
