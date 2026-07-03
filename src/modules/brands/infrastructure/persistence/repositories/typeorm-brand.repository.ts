import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Brand } from '../../../domain/entities/brand.entity';
import { IBrandRepository } from '../../../domain/interfaces/brand-repository.interface';
import { BrandMapper } from '../../../application/mappers/brand.mapper';
import { BrandOrmEntity } from '../entities/brand.orm-entity';

@Injectable()
export class TypeOrmBrandRepository implements IBrandRepository {
  constructor(
    @InjectRepository(BrandOrmEntity)
    private readonly repository: Repository<BrandOrmEntity>,
  ) {}

  async findById(id: string): Promise<Brand | null> {
    const brand = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return brand ? BrandMapper.toDomain(brand) : null;
  }

  async findAll(): Promise<Brand[]> {
    // Stable ordering avoids subtle diffs in UI/API consumers that reconcile full collections.
    const brands = await this.repository.find({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
    });

    return brands.map((brand) => BrandMapper.toDomain(brand));
  }

  async create(brand: Brand): Promise<Brand> {
    const ormEntity = BrandMapper.toOrm(brand);
    const saved = await this.repository.save(ormEntity);
    return BrandMapper.toDomain(saved);
  }

  async update(brand: Brand): Promise<Brand> {
    const ormEntity = BrandMapper.toOrm(brand);
    const saved = await this.repository.save(ormEntity);
    return BrandMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete({ id });
  }
}
