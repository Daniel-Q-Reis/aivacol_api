import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CACHE_SERVICE,
  ICacheService,
} from '../../../../common/domain/interfaces/cache-service.interface';
import { DuplicateEntityException } from '../../../../common/domain/exceptions/duplicate-entity.exception';
import { EntityNotFoundException } from '../../../../common/domain/exceptions/entity-not-found.exception';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import {
  MODEL_REPOSITORY,
  IModelRepository,
} from '../../../models/domain/interfaces/model-repository.interface';
import {
  IVehicleRepository,
  VEHICLE_REPOSITORY,
  VehicleListQuery,
} from '../../domain/interfaces/vehicle-repository.interface';
import { VehicleMapper } from '../mappers/vehicle.mapper';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto';
import { UpdateVehicleDto } from '../dtos/update-vehicle.dto';
import { VehicleListResponseDto, VehicleResponseDto } from '../dtos/vehicle-response.dto';

const VEHICLE_LIST_CACHE_PREFIX = 'vehicles:list';
const VEHICLE_ITEM_CACHE_PREFIX = 'vehicles:item';
const VEHICLE_MAX_LIMIT = 100;

export interface VehicleListQueryInput {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
}

interface ServiceContext {
  userId?: string;
  correlationId?: string;
}

@Injectable()
export class VehicleService {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicleRepository: IVehicleRepository,
    @Inject(MODEL_REPOSITORY) private readonly modelRepository: IModelRepository,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    dto: CreateVehicleDto,
    userId: string,
    correlationId?: string,
  ): Promise<VehicleResponseDto> {
    // Referential validation in service keeps 404 contract stable before DB-level FK errors.
    await this.assertModelExists(dto.modelId);
    await this.ensureNoDuplicates(dto.licensePlate, dto.chassis, dto.renavam);

    const vehicle = VehicleMapper.createDomainFromPrimitives({
      licensePlate: dto.licensePlate,
      chassis: dto.chassis,
      renavam: dto.renavam,
      year: dto.year,
      modelId: dto.modelId,
      createdBy: userId,
    });

    const created = await this.vehicleRepository.create(vehicle);
    await this.invalidateCache(created.id);

    this.eventEmitter.emit('vehicle.created', {
      vehicleId: created.id,
      licensePlate: created.licensePlate.getValue(),
      chassis: created.chassis.getValue(),
      renavam: created.renavam.getValue(),
      modelId: created.modelId,
      year: created.year,
      userId,
      correlationId,
    });

    this.emitAudit('MUTATION', 'VEHICLE', {
      userId,
      correlationId,
      entityId: created.id,
      metadata: { operation: 'CREATE' },
      changes: {
        licensePlate: created.licensePlate.getValue(),
        chassis: created.chassis.getValue(),
        renavam: created.renavam.getValue(),
      },
    });

    return this.toResponse(created);
  }

  async findAll(
    query: VehicleListQueryInput,
    context?: ServiceContext,
  ): Promise<VehicleListResponseDto> {
    const safeQuery = this.normalizeListQuery(query);
    const cacheKey = this.getListCacheKey(safeQuery);
    const cached = await this.cacheService.get<VehicleListResponseDto>(cacheKey);

    if (cached) {
      // Cache hits are audited too, so READ observability reflects real API demand.
      this.emitAudit('READ', 'VEHICLE', {
        userId: context?.userId,
        correlationId: context?.correlationId,
        metadata: { operation: 'FIND_ALL', source: 'cache', ...safeQuery },
      });
      return cached;
    }

    const result = await this.vehicleRepository.findAll(safeQuery);
    const response: VehicleListResponseDto = {
      items: result.items.map((item) => this.toResponse(item)),
      page: safeQuery.page,
      limit: safeQuery.limit,
      total: result.total,
    };

    await this.cacheService.set(cacheKey, response);

    this.emitAudit('READ', 'VEHICLE', {
      userId: context?.userId,
      correlationId: context?.correlationId,
      metadata: { operation: 'FIND_ALL', source: 'database', ...safeQuery },
    });

    return response;
  }

  async findById(id: string, context?: ServiceContext): Promise<VehicleResponseDto> {
    const cacheKey = this.getItemCacheKey(id);
    const cached = await this.cacheService.get<VehicleResponseDto>(cacheKey);

    if (cached) {
      this.emitAudit('READ', 'VEHICLE', {
        userId: context?.userId,
        correlationId: context?.correlationId,
        entityId: id,
        metadata: { operation: 'FIND_BY_ID', source: 'cache' },
      });
      return cached;
    }

    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new EntityNotFoundException({
        entityName: 'Vehicle',
        identifier: id,
        code: ERROR_CATALOG.VEHICLE_NOT_FOUND.code,
      });
    }

    const response = this.toResponse(vehicle);
    await this.cacheService.set(cacheKey, response);

    this.emitAudit('READ', 'VEHICLE', {
      userId: context?.userId,
      correlationId: context?.correlationId,
      entityId: id,
      metadata: { operation: 'FIND_BY_ID', source: 'database' },
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateVehicleDto,
    userId: string,
    correlationId?: string,
  ): Promise<VehicleResponseDto> {
    const existing = await this.vehicleRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException({
        entityName: 'Vehicle',
        identifier: id,
        code: ERROR_CATALOG.VEHICLE_NOT_FOUND.code,
      });
    }

    const modelId = dto.modelId ?? existing.modelId;
    await this.assertModelExists(modelId);

    const nextLicensePlate = dto.licensePlate ?? existing.licensePlate.getValue();
    const nextChassis = dto.chassis ?? existing.chassis.getValue();
    const nextRenavam = dto.renavam ?? existing.renavam.getValue();
    await this.ensureNoDuplicates(nextLicensePlate, nextChassis, nextRenavam, id);

    const updated = VehicleMapper.createDomainFromPrimitives({
      id: existing.id,
      licensePlate: nextLicensePlate,
      chassis: nextChassis,
      renavam: nextRenavam,
      year: dto.year ?? existing.year,
      modelId,
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.vehicleRepository.update(updated);
    await this.invalidateCache(id);

    this.eventEmitter.emit('vehicle.updated', {
      vehicleId: saved.id,
      licensePlate: saved.licensePlate.getValue(),
      chassis: saved.chassis.getValue(),
      renavam: saved.renavam.getValue(),
      modelId: saved.modelId,
      year: saved.year,
      userId,
      correlationId,
    });

    this.emitAudit('MUTATION', 'VEHICLE', {
      userId,
      correlationId,
      entityId: saved.id,
      metadata: { operation: 'UPDATE' },
      changes: {
        licensePlate: saved.licensePlate.getValue(),
        chassis: saved.chassis.getValue(),
        renavam: saved.renavam.getValue(),
        modelId: saved.modelId,
        year: saved.year,
      },
    });

    return this.toResponse(saved);
  }

  async delete(id: string, userId: string, correlationId?: string): Promise<void> {
    const existing = await this.vehicleRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException({
        entityName: 'Vehicle',
        identifier: id,
        code: ERROR_CATALOG.VEHICLE_NOT_FOUND.code,
      });
    }

    await this.vehicleRepository.delete(id);
    await this.invalidateCache(id);

    this.emitAudit('MUTATION', 'VEHICLE', {
      userId,
      correlationId,
      entityId: id,
      metadata: { operation: 'DELETE' },
    });
  }

  private async ensureNoDuplicates(
    licensePlate: string,
    chassis: string,
    renavam: string,
    ignoreVehicleId?: string,
  ): Promise<void> {
    const [existingByPlate, existingByChassis, existingByRenavam] = await Promise.all([
      this.vehicleRepository.findByLicensePlate(licensePlate),
      this.vehicleRepository.findByChassis(chassis),
      this.vehicleRepository.findByRenavam(renavam),
    ]);

    // SQL Server UUID casing can vary; normalize both sides to avoid false duplicate conflicts.
    const normalizedIgnoreVehicleId = ignoreVehicleId?.toLowerCase();
    const isSameVehicle = (candidateId: string): boolean =>
      normalizedIgnoreVehicleId !== undefined &&
      candidateId.toLowerCase() === normalizedIgnoreVehicleId;

    if (existingByPlate && !isSameVehicle(existingByPlate.id)) {
      throw new DuplicateEntityException({
        entityName: 'Vehicle',
        field: 'license_plate',
        value: licensePlate,
        code: ERROR_CATALOG.DUPLICATE_LICENSE_PLATE.code,
      });
    }

    if (existingByChassis && !isSameVehicle(existingByChassis.id)) {
      throw new DuplicateEntityException({
        entityName: 'Vehicle',
        field: 'chassis',
        value: chassis,
        code: ERROR_CATALOG.DUPLICATE_CHASSIS.code,
      });
    }

    if (existingByRenavam && !isSameVehicle(existingByRenavam.id)) {
      throw new DuplicateEntityException({
        entityName: 'Vehicle',
        field: 'renavam',
        value: renavam,
        code: ERROR_CATALOG.DUPLICATE_RENAVAM.code,
      });
    }
  }

  private async assertModelExists(modelId: string): Promise<void> {
    const model = await this.modelRepository.findById(modelId);
    if (!model) {
      throw new EntityNotFoundException({
        entityName: 'Model',
        identifier: modelId,
        code: ERROR_CATALOG.MODEL_NOT_FOUND.code,
      });
    }
  }

  private normalizeListQuery(query: VehicleListQueryInput): VehicleListQuery {
    const page = Number.isFinite(Number(query.page)) ? Number(query.page) : 1;
    const limit = Number.isFinite(Number(query.limit)) ? Number(query.limit) : 20;
    const safeSort = query.sort === 'updatedAt' || query.sort === 'year' ? query.sort : 'createdAt';
    const safeOrder = query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    return {
      // Defensive caps prevent unbounded cache cardinality and abusive page sizes.
      page: Math.max(1, page),
      limit: Math.max(1, Math.min(limit, VEHICLE_MAX_LIMIT)),
      sort: safeSort,
      order: safeOrder,
    };
  }

  private toResponse(vehicle: {
    id: string;
    licensePlate: { getValue(): string };
    chassis: { getValue(): string };
    renavam: { getValue(): string };
    year: number;
    modelId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }): VehicleResponseDto {
    return {
      id: vehicle.id,
      licensePlate: vehicle.licensePlate.getValue(),
      chassis: vehicle.chassis.getValue(),
      renavam: vehicle.renavam.getValue(),
      year: vehicle.year,
      modelId: vehicle.modelId,
      createdBy: vehicle.createdBy,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
    };
  }

  private getListCacheKey(query: VehicleListQuery): string {
    return `${VEHICLE_LIST_CACHE_PREFIX}:${query.page}:${query.limit}:${query.sort}:${query.order}`;
  }

  private getItemCacheKey(id: string): string {
    return `${VEHICLE_ITEM_CACHE_PREFIX}:${id}`;
  }

  private async invalidateCache(vehicleId: string): Promise<void> {
    // List keys are parameterized, so pattern invalidation keeps cache coherence without tracking every permutation.
    await Promise.all([
      this.cacheService.del(this.getItemCacheKey(vehicleId)),
      this.cacheService.delByPattern(`${VEHICLE_LIST_CACHE_PREFIX}:*`),
    ]);
  }

  private emitAudit(
    action: 'AUTH' | 'READ' | 'MUTATION',
    entity: string,
    payload: {
      userId?: string;
      correlationId?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
      changes?: Record<string, unknown>;
    },
  ): void {
    // correlationId is mirrored into async audit metadata for end-to-end traceability.
    this.eventEmitter.emit('audit.service_interaction', {
      action,
      entity,
      entityId: payload.entityId,
      userId: payload.userId,
      metadata: {
        correlationId: payload.correlationId,
        ...payload.metadata,
      },
      changes: payload.changes,
      timestamp: new Date(),
    });
  }
}
