import { EventEmitter2 } from '@nestjs/event-emitter';
import { DuplicateEntityException } from '../../../../common/domain/exceptions/duplicate-entity.exception';
import { ICacheService } from '../../../../common/domain/interfaces/cache-service.interface';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { IModelRepository } from '../../../models/domain/interfaces/model-repository.interface';
import { VehicleMapper } from '../mappers/vehicle.mapper';
import { IVehicleRepository } from '../../domain/interfaces/vehicle-repository.interface';
import { VehicleService } from './vehicle.service';

const makeVehicle = (id = '2c6d9ec8-aa65-4eba-8f54-fb0f65f3f471') =>
  VehicleMapper.createDomainFromPrimitives({
    id,
    licensePlate: 'ABC1D23',
    chassis: '9BWZZZ377VT004251',
    renavam: '00123456789',
    year: 2024,
    modelId: 'a5f67e35-42d6-4182-a8be-d7f95adf3fbc',
    createdBy: 'e90f4f5c-fd4e-4a8f-a152-7283e4f79d75',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

describe('VehicleService', () => {
  let service: VehicleService;
  let vehicleRepository: jest.Mocked<IVehicleRepository>;
  let modelRepository: jest.Mocked<IModelRepository>;
  let cacheService: jest.Mocked<ICacheService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    vehicleRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByLicensePlate: jest.fn(),
      findByChassis: jest.fn(),
      findByRenavam: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    modelRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    service = new VehicleService(vehicleRepository, modelRepository, cacheService, eventEmitter);
  });

  it('creates a vehicle, invalidates cache, and emits domain/audit events', async () => {
    const created = makeVehicle();
    modelRepository.findById.mockResolvedValue({ id: created.modelId } as never);
    vehicleRepository.findByLicensePlate.mockResolvedValue(null);
    vehicleRepository.findByChassis.mockResolvedValue(null);
    vehicleRepository.findByRenavam.mockResolvedValue(null);
    vehicleRepository.create.mockResolvedValue(created);
    cacheService.del.mockResolvedValue();
    cacheService.delByPattern.mockResolvedValue(1);

    const result = await service.create(
      {
        licensePlate: 'ABC1D23',
        chassis: '9BWZZZ377VT004251',
        renavam: '00123456789',
        year: 2024,
        modelId: created.modelId,
      },
      created.createdBy,
      'cid-1',
    );

    expect(result.id).toBe(created.id);
    expect(cacheService.del).toHaveBeenCalledWith(`vehicles:item:${created.id}`);
    expect(cacheService.delByPattern).toHaveBeenCalledWith('vehicles:list:*');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'vehicle.created',
      expect.objectContaining({ vehicleId: created.id, correlationId: 'cid-1' }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({ action: 'MUTATION', entity: 'VEHICLE' }),
    );
  });

  it('rejects create when model does not exist', async () => {
    modelRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(
        {
          licensePlate: 'ABC1D23',
          chassis: '9BWZZZ377VT004251',
          renavam: '00123456789',
          year: 2024,
          modelId: '8ef6f7d8-c355-4117-b6f9-8e6e0c6167ca',
        },
        'd8276f2e-b83a-4755-b0a6-6fda73d72be5',
      ),
    ).rejects.toMatchObject({ code: ERROR_CATALOG.MODEL_NOT_FOUND.code });
  });

  it('rejects create when duplicate license plate exists', async () => {
    modelRepository.findById.mockResolvedValue({ id: 'x' } as never);
    vehicleRepository.findByLicensePlate.mockResolvedValue(
      makeVehicle('b98d63ff-c2fe-4fb8-b300-859d791d4ca7'),
    );
    vehicleRepository.findByChassis.mockResolvedValue(null);
    vehicleRepository.findByRenavam.mockResolvedValue(null);

    await expect(
      service.create(
        {
          licensePlate: 'ABC1D23',
          chassis: '9BWZZZ377VT004251',
          renavam: '00123456789',
          year: 2024,
          modelId: 'a5f67e35-42d6-4182-a8be-d7f95adf3fbc',
        },
        'e90f4f5c-fd4e-4a8f-a152-7283e4f79d75',
      ),
    ).rejects.toBeInstanceOf(DuplicateEntityException);
  });

  it('findAll returns cache hit without repository access', async () => {
    const cached = { items: [], page: 1, limit: 20, total: 0 };
    cacheService.get.mockResolvedValue(cached);

    const result = await service.findAll(
      { page: 1, limit: 20 },
      { userId: 'u1', correlationId: 'cid' },
    );

    expect(result).toEqual(cached);
    expect(vehicleRepository.findAll).not.toHaveBeenCalled();
    // This audit assertion protects observability regressions when read path is served from cache only.
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({
        action: 'READ',
        metadata: expect.objectContaining({ source: 'cache' }),
      }),
    );
  });

  it('findAll returns cache miss and stores response', async () => {
    const item = makeVehicle();
    cacheService.get.mockResolvedValue(null);
    vehicleRepository.findAll.mockResolvedValue({ items: [item], total: 1 });
    cacheService.set.mockResolvedValue();

    const result = await service.findAll({ page: 1, limit: 10, sort: 'createdAt', order: 'desc' });

    expect(result.total).toBe(1);
    expect(vehicleRepository.findAll).toHaveBeenCalled();
    expect(cacheService.set).toHaveBeenCalledWith(
      'vehicles:list:1:10:createdAt:desc',
      expect.objectContaining({ total: 1 }),
    );
  });

  it('findById returns from cache when available', async () => {
    cacheService.get.mockResolvedValue({
      id: 'v1',
      licensePlate: 'ABC1D23',
      chassis: '9BWZZZ377VT004251',
      renavam: '00123456789',
      year: 2024,
      modelId: 'm1',
      createdBy: 'u1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await service.findById('v1');

    expect(result.id).toBe('v1');
    expect(vehicleRepository.findById).not.toHaveBeenCalled();
  });

  it('findById throws when entity does not exist', async () => {
    cacheService.get.mockResolvedValue(null);
    vehicleRepository.findById.mockResolvedValue(null);

    await expect(service.findById('missing-id')).rejects.toMatchObject({
      code: ERROR_CATALOG.VEHICLE_NOT_FOUND.code,
    });
  });

  it('update persists and emits vehicle.updated', async () => {
    const existing = makeVehicle('b1542e08-605f-40aa-ac47-ae59d31e8dee');
    const updated = makeVehicle('b1542e08-605f-40aa-ac47-ae59d31e8dee');
    vehicleRepository.findById.mockResolvedValue(existing);
    modelRepository.findById.mockResolvedValue({ id: existing.modelId } as never);
    vehicleRepository.findByLicensePlate.mockResolvedValue(existing);
    vehicleRepository.findByChassis.mockResolvedValue(existing);
    vehicleRepository.findByRenavam.mockResolvedValue(existing);
    vehicleRepository.update.mockResolvedValue(updated);
    cacheService.del.mockResolvedValue();
    cacheService.delByPattern.mockResolvedValue(1);

    const result = await service.update(
      existing.id,
      { year: 2025 },
      'user-1f71fd5e-2789-42ee-b6d7-45ba53bf41ec',
      'cid-2',
    );

    expect(result.id).toBe(existing.id);
    expect(vehicleRepository.update).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'vehicle.updated',
      expect.objectContaining({ vehicleId: existing.id, correlationId: 'cid-2' }),
    );
  });

  it('update throws when target vehicle is missing', async () => {
    vehicleRepository.findById.mockResolvedValue(null);

    await expect(service.update('missing-id', { year: 2025 }, 'user-1')).rejects.toMatchObject({
      code: ERROR_CATALOG.VEHICLE_NOT_FOUND.code,
    });
  });

  it('delete removes with cache invalidation and audit event', async () => {
    const existing = makeVehicle('6f834dc3-4a39-486e-bad4-cddb9b8b3c14');
    vehicleRepository.findById.mockResolvedValue(existing);
    vehicleRepository.delete.mockResolvedValue();
    cacheService.del.mockResolvedValue();
    cacheService.delByPattern.mockResolvedValue(1);

    await service.delete(existing.id, 'user-1', 'cid-3');

    expect(vehicleRepository.delete).toHaveBeenCalledWith(existing.id);
    expect(cacheService.del).toHaveBeenCalledWith(`vehicles:item:${existing.id}`);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({ action: 'MUTATION', entityId: existing.id }),
    );
  });

  it('delete throws when vehicle is missing', async () => {
    vehicleRepository.findById.mockResolvedValue(null);

    await expect(service.delete('missing-id', 'user-1')).rejects.toMatchObject({
      code: ERROR_CATALOG.VEHICLE_NOT_FOUND.code,
    });
  });
});
