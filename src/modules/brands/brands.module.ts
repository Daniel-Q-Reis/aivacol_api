import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BRAND_REPOSITORY } from './domain/interfaces/brand-repository.interface';
import { TypeOrmBrandRepository } from './infrastructure/persistence/repositories/typeorm-brand.repository';
import { BrandOrmEntity } from './infrastructure/persistence/entities/brand.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([BrandOrmEntity])],
  providers: [
    TypeOrmBrandRepository,
    {
      provide: BRAND_REPOSITORY,
      useExisting: TypeOrmBrandRepository,
    },
  ],
  exports: [BRAND_REPOSITORY],
})
export class BrandsModule {}
