import { EventEmitter2 } from '@nestjs/event-emitter';
import { DuplicateEntityException } from '../../../../common/domain/exceptions/duplicate-entity.exception';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { BrandMapper } from '../../../brands/application/mappers/brand.mapper';
import { IBrandRepository } from '../../../brands/domain/interfaces/brand-repository.interface';
import { ModelMapper } from '../mappers/model.mapper';
import { IModelRepository } from '../../domain/interfaces/model-repository.interface';
import { ModelService } from './model.service';

describe('ModelService', () => {
  let service: ModelService;
  let modelRepository: jest.Mocked<IModelRepository>;
  let brandRepository: jest.Mocked<IBrandRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    modelRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    brandRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    service = new ModelService(modelRepository, brandRepository, eventEmitter);
  });

  it('creates model with brand validation and audit event', async () => {
    const brand = BrandMapper.createDomainFromPrimitives({
      id: '51852348-23c9-437f-8eaf-f938f95bc9e4',
      name: 'Toyota',
      createdBy: '17ed8f12-6f76-40cc-a35d-e88ce3a6e5ec',
    });
    const created = ModelMapper.createDomainFromPrimitives({
      id: 'ef77395e-a816-4d09-bb0d-151f1536611d',
      name: 'Corolla',
      brandId: brand.id,
      createdBy: '17ed8f12-6f76-40cc-a35d-e88ce3a6e5ec',
    });

    brandRepository.findById.mockResolvedValue(brand);
    modelRepository.findAll.mockResolvedValue([]);
    modelRepository.create.mockResolvedValue(created);

    const result = await service.create(
      { name: 'Corolla', brandId: brand.id },
      '17ed8f12-6f76-40cc-a35d-e88ce3a6e5ec',
      'cid-1',
    );

    expect(result.id).toBe(created.id);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({ action: 'MUTATION', entity: 'MODEL' }),
    );
  });

  it('throws when creating model with unknown brand', async () => {
    brandRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(
        { name: 'Corolla', brandId: 'd57eca72-0d94-4889-b852-e9486e607619' },
        'user-1',
      ),
    ).rejects.toMatchObject({ code: ERROR_CATALOG.BRAND_NOT_FOUND.code });
  });

  it('throws duplicate when model name exists within same brand', async () => {
    const brand = BrandMapper.createDomainFromPrimitives({
      id: '51852348-23c9-437f-8eaf-f938f95bc9e4',
      name: 'Toyota',
      createdBy: '17ed8f12-6f76-40cc-a35d-e88ce3a6e5ec',
    });
    const existing = ModelMapper.createDomainFromPrimitives({
      id: '33af6e06-3148-4f94-a16c-509b1cc63f20',
      name: 'Corolla',
      brandId: brand.id,
      createdBy: 'x',
    });

    brandRepository.findById.mockResolvedValue(brand);
    modelRepository.findAll.mockResolvedValue([existing]);

    await expect(
      service.create({ name: ' corolla ', brandId: brand.id }, 'user-1'),
    ).rejects.toBeInstanceOf(DuplicateEntityException);
  });

  it('findAll returns list and emits read audit', async () => {
    const model = ModelMapper.createDomainFromPrimitives({
      id: 'ef77395e-a816-4d09-bb0d-151f1536611d',
      name: 'Corolla',
      brandId: '51852348-23c9-437f-8eaf-f938f95bc9e4',
      createdBy: '17ed8f12-6f76-40cc-a35d-e88ce3a6e5ec',
    });
    modelRepository.findAll.mockResolvedValue([model]);

    const result = await service.findAll({ userId: 'u1', correlationId: 'cid' });

    expect(result).toHaveLength(1);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({
        action: 'READ',
        metadata: expect.objectContaining({ operation: 'FIND_ALL' }),
      }),
    );
  });

  it('findById returns entity and throws when absent', async () => {
    const model = ModelMapper.createDomainFromPrimitives({
      id: 'ef77395e-a816-4d09-bb0d-151f1536611d',
      name: 'Corolla',
      brandId: '51852348-23c9-437f-8eaf-f938f95bc9e4',
      createdBy: '17ed8f12-6f76-40cc-a35d-e88ce3a6e5ec',
    });
    modelRepository.findById.mockResolvedValue(model);
    await expect(service.findById(model.id)).resolves.toMatchObject({ id: model.id });

    modelRepository.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toMatchObject({
      code: ERROR_CATALOG.MODEL_NOT_FOUND.code,
    });
  });

  it('updates model and validates duplicate scope', async () => {
    const existing = ModelMapper.createDomainFromPrimitives({
      id: 'ef77395e-a816-4d09-bb0d-151f1536611d',
      name: 'Corolla',
      brandId: '51852348-23c9-437f-8eaf-f938f95bc9e4',
      createdBy: '17ed8f12-6f76-40cc-a35d-e88ce3a6e5ec',
    });
    const other = ModelMapper.createDomainFromPrimitives({
      id: 'a6aa04da-7f57-40ab-a2da-f8deff0f4b8a',
      name: 'Yaris',
      brandId: existing.brandId,
      createdBy: existing.createdBy,
    });

    brandRepository.findById.mockResolvedValue(
      BrandMapper.createDomainFromPrimitives({
        id: existing.brandId,
        name: 'Toyota',
        createdBy: existing.createdBy,
      }),
    );
    modelRepository.findById.mockResolvedValue(existing);
    modelRepository.findAll.mockResolvedValue([existing, other]);
    modelRepository.update.mockResolvedValue(
      ModelMapper.createDomainFromPrimitives({
        id: existing.id,
        name: 'Corolla Cross',
        brandId: existing.brandId,
        createdBy: existing.createdBy,
        createdAt: existing.createdAt,
      }),
    );

    const updated = await service.update(
      existing.id,
      { name: 'Corolla Cross' },
      existing.createdBy,
      'cid',
    );

    expect(updated.name).toBe('Corolla Cross');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({
        action: 'MUTATION',
        metadata: expect.objectContaining({ operation: 'UPDATE' }),
      }),
    );
  });

  it('delete removes model and emits audit', async () => {
    const existing = ModelMapper.createDomainFromPrimitives({
      id: 'ef77395e-a816-4d09-bb0d-151f1536611d',
      name: 'Corolla',
      brandId: '51852348-23c9-437f-8eaf-f938f95bc9e4',
      createdBy: '17ed8f12-6f76-40cc-a35d-e88ce3a6e5ec',
    });

    modelRepository.findById.mockResolvedValue(existing);
    modelRepository.delete.mockResolvedValue();

    await service.delete(existing.id, 'user-1', 'cid-2');

    expect(modelRepository.delete).toHaveBeenCalledWith(existing.id);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({
        action: 'MUTATION',
        metadata: expect.objectContaining({ operation: 'DELETE' }),
      }),
    );
  });
});
