import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsModule } from '../brands/brands.module';
import { ModelService } from './application/services/model.service';
import { MODEL_REPOSITORY } from './domain/interfaces/model-repository.interface';
import { ModelOrmEntity } from './infrastructure/persistence/entities/model.orm-entity';
import { TypeOrmModelRepository } from './infrastructure/persistence/repositories/typeorm-model.repository';
import { ModelController } from './presentation/controllers/model.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ModelOrmEntity]), BrandsModule],
  controllers: [ModelController],
  providers: [
    TypeOrmModelRepository,
    ModelService,
    {
      provide: MODEL_REPOSITORY,
      useExisting: TypeOrmModelRepository,
    },
  ],
  exports: [MODEL_REPOSITORY, ModelService],
})
export class ModelsModule {}
