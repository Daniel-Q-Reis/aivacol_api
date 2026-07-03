import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DuplicateEntityException } from '../../../../common/domain/exceptions/duplicate-entity.exception';
import { EntityNotFoundException } from '../../../../common/domain/exceptions/entity-not-found.exception';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import {
  BRAND_REPOSITORY,
  IBrandRepository,
} from '../../../brands/domain/interfaces/brand-repository.interface';
import { CreateModelDto } from '../dtos/create-model.dto';
import { ModelResponseDto } from '../dtos/model-response.dto';
import { UpdateModelDto } from '../dtos/update-model.dto';
import { ModelMapper } from '../mappers/model.mapper';
import {
  IModelRepository,
  MODEL_REPOSITORY,
} from '../../domain/interfaces/model-repository.interface';

interface ServiceContext {
  userId?: string;
  correlationId?: string;
}

@Injectable()
export class ModelService {
  constructor(
    @Inject(MODEL_REPOSITORY) private readonly modelRepository: IModelRepository,
    @Inject(BRAND_REPOSITORY) private readonly brandRepository: IBrandRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    dto: CreateModelDto,
    userId: string,
    correlationId?: string,
  ): Promise<ModelResponseDto> {
    await this.assertBrandExists(dto.brandId);
    await this.ensureUniqueNameByBrand(dto.name, dto.brandId);

    const model = ModelMapper.createDomainFromPrimitives({
      name: dto.name,
      brandId: dto.brandId,
      createdBy: userId,
    });

    const created = await this.modelRepository.create(model);
    this.emitAudit('MUTATION', created.id, {
      userId,
      correlationId,
      metadata: { operation: 'CREATE' },
    });

    return this.toResponse(created);
  }

  async findAll(context?: ServiceContext): Promise<ModelResponseDto[]> {
    const items = await this.modelRepository.findAll();

    this.emitAudit('READ', undefined, {
      userId: context?.userId,
      correlationId: context?.correlationId,
      metadata: { operation: 'FIND_ALL' },
    });

    return items.map((item) => this.toResponse(item));
  }

  async findById(id: string, context?: ServiceContext): Promise<ModelResponseDto> {
    const model = await this.modelRepository.findById(id);
    if (!model) {
      throw new EntityNotFoundException({
        entityName: 'Model',
        identifier: id,
        code: ERROR_CATALOG.MODEL_NOT_FOUND.code,
      });
    }

    this.emitAudit('READ', id, {
      userId: context?.userId,
      correlationId: context?.correlationId,
      metadata: { operation: 'FIND_BY_ID' },
    });

    return this.toResponse(model);
  }

  async update(
    id: string,
    dto: UpdateModelDto,
    userId: string,
    correlationId?: string,
  ): Promise<ModelResponseDto> {
    const existing = await this.modelRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException({
        entityName: 'Model',
        identifier: id,
        code: ERROR_CATALOG.MODEL_NOT_FOUND.code,
      });
    }

    const brandId = dto.brandId ?? existing.brandId;
    await this.assertBrandExists(brandId);
    await this.ensureUniqueNameByBrand(dto.name ?? existing.name, brandId, id);

    const updated = ModelMapper.createDomainFromPrimitives({
      id: existing.id,
      name: dto.name ?? existing.name,
      brandId,
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.modelRepository.update(updated);
    this.emitAudit('MUTATION', id, {
      userId,
      correlationId,
      metadata: { operation: 'UPDATE' },
    });

    return this.toResponse(saved);
  }

  async delete(id: string, userId: string, correlationId?: string): Promise<void> {
    const existing = await this.modelRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException({
        entityName: 'Model',
        identifier: id,
        code: ERROR_CATALOG.MODEL_NOT_FOUND.code,
      });
    }

    await this.modelRepository.delete(id);
    this.emitAudit('MUTATION', id, {
      userId,
      correlationId,
      metadata: { operation: 'DELETE' },
    });
  }

  private async assertBrandExists(brandId: string): Promise<void> {
    const brand = await this.brandRepository.findById(brandId);
    if (!brand) {
      throw new EntityNotFoundException({
        entityName: 'Brand',
        identifier: brandId,
        code: ERROR_CATALOG.BRAND_NOT_FOUND.code,
      });
    }
  }

  private async ensureUniqueNameByBrand(
    name: string,
    brandId: string,
    ignoreModelId?: string,
  ): Promise<void> {
    const all = await this.modelRepository.findAll();
    const normalized = name.trim().toLowerCase();
    const duplicate = all.find(
      (item) =>
        item.brandId === brandId &&
        item.name.trim().toLowerCase() === normalized &&
        item.id !== ignoreModelId,
    );

    if (duplicate) {
      throw new DuplicateEntityException({
        entityName: 'Model',
        field: 'name',
        value: name,
        code: ERROR_CATALOG.DUPLICATE_MODEL_NAME.code,
      });
    }
  }

  private toResponse(model: {
    id: string;
    name: string;
    brandId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }): ModelResponseDto {
    return {
      id: model.id,
      name: model.name,
      brandId: model.brandId,
      createdBy: model.createdBy,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }

  private emitAudit(
    action: 'READ' | 'MUTATION',
    entityId: string | undefined,
    payload: {
      userId?: string;
      correlationId?: string;
      metadata?: Record<string, unknown>;
    },
  ): void {
    this.eventEmitter.emit('audit.service_interaction', {
      action,
      entity: 'MODEL',
      entityId,
      userId: payload.userId,
      metadata: {
        correlationId: payload.correlationId,
        ...payload.metadata,
      },
      timestamp: new Date(),
    });
  }
}
