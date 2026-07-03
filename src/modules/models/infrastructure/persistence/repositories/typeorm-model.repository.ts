import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Model } from '../../../domain/entities/model.entity';
import { IModelRepository } from '../../../domain/interfaces/model-repository.interface';
import { ModelMapper } from '../../../application/mappers/model.mapper';
import { ModelOrmEntity } from '../entities/model.orm-entity';

@Injectable()
export class TypeOrmModelRepository implements IModelRepository {
  constructor(
    @InjectRepository(ModelOrmEntity)
    private readonly repository: Repository<ModelOrmEntity>,
  ) {}

  async findById(id: string): Promise<Model | null> {
    const model = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return model ? ModelMapper.toDomain(model) : null;
  }

  async findAll(): Promise<Model[]> {
    const models = await this.repository.find({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
    });

    return models.map((model) => ModelMapper.toDomain(model));
  }

  async create(model: Model): Promise<Model> {
    const ormEntity = ModelMapper.toOrm(model);
    const saved = await this.repository.save(ormEntity);
    return ModelMapper.toDomain(saved);
  }

  async update(model: Model): Promise<Model> {
    const ormEntity = ModelMapper.toOrm(model);
    const saved = await this.repository.save(ormEntity);
    return ModelMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete({ id });
  }
}
