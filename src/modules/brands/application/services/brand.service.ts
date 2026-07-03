import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DuplicateEntityException } from '../../../../common/domain/exceptions/duplicate-entity.exception';
import { EntityNotFoundException } from '../../../../common/domain/exceptions/entity-not-found.exception';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { BrandMapper } from '../mappers/brand.mapper';
import {
  IBrandRepository,
  BRAND_REPOSITORY,
} from '../../domain/interfaces/brand-repository.interface';
import { BrandResponseDto } from '../dtos/brand-response.dto';
import { CreateBrandDto } from '../dtos/create-brand.dto';
import { UpdateBrandDto } from '../dtos/update-brand.dto';

interface ServiceContext {
  userId?: string;
  correlationId?: string;
}

@Injectable()
export class BrandService {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brandRepository: IBrandRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    dto: CreateBrandDto,
    userId: string,
    correlationId?: string,
  ): Promise<BrandResponseDto> {
    await this.ensureUniqueName(dto.name);

    const brand = BrandMapper.createDomainFromPrimitives({
      name: dto.name,
      createdBy: userId,
    });

    const created = await this.brandRepository.create(brand);
    this.emitAudit('MUTATION', created.id, {
      userId,
      correlationId,
      metadata: { operation: 'CREATE' },
    });

    return this.toResponse(created);
  }

  async findAll(context?: ServiceContext): Promise<BrandResponseDto[]> {
    const items = await this.brandRepository.findAll();
    this.emitAudit('READ', undefined, {
      userId: context?.userId,
      correlationId: context?.correlationId,
      metadata: { operation: 'FIND_ALL' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async findById(id: string, context?: ServiceContext): Promise<BrandResponseDto> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new EntityNotFoundException({
        entityName: 'Brand',
        identifier: id,
        code: ERROR_CATALOG.BRAND_NOT_FOUND.code,
      });
    }

    this.emitAudit('READ', id, {
      userId: context?.userId,
      correlationId: context?.correlationId,
      metadata: { operation: 'FIND_BY_ID' },
    });
    return this.toResponse(brand);
  }

  async update(
    id: string,
    dto: UpdateBrandDto,
    userId: string,
    correlationId?: string,
  ): Promise<BrandResponseDto> {
    const existing = await this.brandRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException({
        entityName: 'Brand',
        identifier: id,
        code: ERROR_CATALOG.BRAND_NOT_FOUND.code,
      });
    }

    const name = dto.name ?? existing.name;
    await this.ensureUniqueName(name, id);

    const updated = BrandMapper.createDomainFromPrimitives({
      id: existing.id,
      name,
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.brandRepository.update(updated);
    this.emitAudit('MUTATION', id, {
      userId,
      correlationId,
      metadata: { operation: 'UPDATE' },
    });

    return this.toResponse(saved);
  }

  async delete(id: string, userId: string, correlationId?: string): Promise<void> {
    const existing = await this.brandRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException({
        entityName: 'Brand',
        identifier: id,
        code: ERROR_CATALOG.BRAND_NOT_FOUND.code,
      });
    }

    await this.brandRepository.delete(id);
    this.emitAudit('MUTATION', id, {
      userId,
      correlationId,
      metadata: { operation: 'DELETE' },
    });
  }

  private async ensureUniqueName(name: string, ignoreBrandId?: string): Promise<void> {
    const all = await this.brandRepository.findAll();
    const normalized = name.trim().toLowerCase();
    const duplicate = all.find(
      (item) => item.name.trim().toLowerCase() === normalized && item.id !== ignoreBrandId,
    );

    if (duplicate) {
      throw new DuplicateEntityException({
        entityName: 'Brand',
        field: 'name',
        value: name,
        code: ERROR_CATALOG.DUPLICATE_BRAND_NAME.code,
      });
    }
  }

  private toResponse(brand: {
    id: string;
    name: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }): BrandResponseDto {
    return {
      id: brand.id,
      name: brand.name,
      createdBy: brand.createdBy,
      createdAt: brand.createdAt.toISOString(),
      updatedAt: brand.updatedAt.toISOString(),
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
      entity: 'BRAND',
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
