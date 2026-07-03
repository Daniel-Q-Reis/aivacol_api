import { Model } from '../entities/model.entity';

export const MODEL_REPOSITORY = Symbol('MODEL_REPOSITORY');

export interface IModelRepository {
  findById(id: string): Promise<Model | null>;
  findAll(): Promise<Model[]>;
  create(model: Model): Promise<Model>;
  update(model: Model): Promise<Model>;
  delete(id: string): Promise<void>;
}
