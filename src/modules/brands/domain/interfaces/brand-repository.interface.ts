import { Brand } from '../entities/brand.entity';

export const BRAND_REPOSITORY = Symbol('BRAND_REPOSITORY');

export interface IBrandRepository {
  findById(id: string): Promise<Brand | null>;
  findAll(): Promise<Brand[]>;
  create(brand: Brand): Promise<Brand>;
  update(brand: Brand): Promise<Brand>;
  delete(id: string): Promise<void>;
}
