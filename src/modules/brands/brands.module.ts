import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandService } from './application/services/brand.service';
import { BRAND_REPOSITORY } from './domain/interfaces/brand-repository.interface';
import { TypeOrmBrandRepository } from './infrastructure/persistence/repositories/typeorm-brand.repository';
import { BrandOrmEntity } from './infrastructure/persistence/entities/brand.orm-entity';
import { BrandController } from './presentation/controllers/brand.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BrandOrmEntity])],
  controllers: [BrandController],
  providers: [
    TypeOrmBrandRepository,
    BrandService,
    {
      provide: BRAND_REPOSITORY,
      useExisting: TypeOrmBrandRepository,
    },
  ],
  exports: [BRAND_REPOSITORY, BrandService],
})
export class BrandsModule {}
