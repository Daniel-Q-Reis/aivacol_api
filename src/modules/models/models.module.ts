import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MODEL_REPOSITORY } from './domain/interfaces/model-repository.interface';
import { ModelOrmEntity } from './infrastructure/persistence/entities/model.orm-entity';
import { TypeOrmModelRepository } from './infrastructure/persistence/repositories/typeorm-model.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ModelOrmEntity])],
  providers: [
    TypeOrmModelRepository,
    {
      provide: MODEL_REPOSITORY,
      useExisting: TypeOrmModelRepository,
    },
  ],
  exports: [MODEL_REPOSITORY],
})
export class ModelsModule {}
