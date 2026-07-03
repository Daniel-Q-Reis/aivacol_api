import { EventEmitter2 } from '@nestjs/event-emitter';
import { DuplicateEntityException } from '../../../../common/domain/exceptions/duplicate-entity.exception';
import { ERROR_CATALOG } from '../../../../common/errors/error-catalog';
import { BrandMapper } from '../mappers/brand.mapper';
import { IBrandRepository } from '../../domain/interfaces/brand-repository.interface';
import { BrandService } from './brand.service';

describe('BrandService', () => {
  let service: BrandService;
  let repository: jest.Mocked<IBrandRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    service = new BrandService(repository, eventEmitter);
  });

  it('creates a brand and emits mutation audit', async () => {
    const created = BrandMapper.createDomainFromPrimitives({
      id: '6f850186-c3e7-4f6d-aad5-ef4d5f304f54',
      name: 'Toyota',
      createdBy: 'e0a57d3e-c145-4bdb-b7ec-669f879f0f9e',
    });
    repository.findAll.mockResolvedValue([]);
    repository.create.mockResolvedValue(created);

    const result = await service.create(
      { name: 'Toyota' },
      'e0a57d3e-c145-4bdb-b7ec-669f879f0f9e',
      'cid-1',
    );

    expect(result.id).toBe(created.id);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({ action: 'MUTATION', entity: 'BRAND' }),
    );
  });

  it('rejects duplicate brand names using normalized comparison', async () => {
    repository.findAll.mockResolvedValue([
      BrandMapper.createDomainFromPrimitives({
        id: '2bc50af1-2237-4b4a-87ef-c17dff9a95f8',
        name: 'Toyota',
        createdBy: 'e0a57d3e-c145-4bdb-b7ec-669f879f0f9e',
      }),
    ]);

    await expect(service.create({ name: ' toyota ' }, 'user-1')).rejects.toBeInstanceOf(
      DuplicateEntityException,
    );
  });

  it('findAll emits read audit and returns mapped response', async () => {
    repository.findAll.mockResolvedValue([
      BrandMapper.createDomainFromPrimitives({
        id: '6f850186-c3e7-4f6d-aad5-ef4d5f304f54',
        name: 'Toyota',
        createdBy: 'e0a57d3e-c145-4bdb-b7ec-669f879f0f9e',
      }),
    ]);

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

  it('findById throws not found when missing', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toMatchObject({
      code: ERROR_CATALOG.BRAND_NOT_FOUND.code,
    });
  });

  it('updates existing brand and emits mutation audit', async () => {
    const existing = BrandMapper.createDomainFromPrimitives({
      id: '6f850186-c3e7-4f6d-aad5-ef4d5f304f54',
      name: 'Toyota',
      createdBy: 'e0a57d3e-c145-4bdb-b7ec-669f879f0f9e',
    });
    const updated = BrandMapper.createDomainFromPrimitives({
      id: existing.id,
      name: 'Toyota Motor',
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      updatedAt: new Date(existing.createdAt.getTime() + 1000),
    });

    repository.findById.mockResolvedValue(existing);
    repository.findAll.mockResolvedValue([existing]);
    repository.update.mockResolvedValue(updated);

    const result = await service.update(existing.id, { name: 'Toyota Motor' }, 'user-1', 'cid-2');

    expect(result.name).toBe('Toyota Motor');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({
        action: 'MUTATION',
        metadata: expect.objectContaining({ operation: 'UPDATE' }),
      }),
    );
  });

  it('deletes existing brand and emits mutation audit', async () => {
    const existing = BrandMapper.createDomainFromPrimitives({
      id: '6f850186-c3e7-4f6d-aad5-ef4d5f304f54',
      name: 'Toyota',
      createdBy: 'e0a57d3e-c145-4bdb-b7ec-669f879f0f9e',
    });
    repository.findById.mockResolvedValue(existing);
    repository.delete.mockResolvedValue();

    await service.delete(existing.id, 'user-1', 'cid-3');

    expect(repository.delete).toHaveBeenCalledWith(existing.id);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'audit.service_interaction',
      expect.objectContaining({
        action: 'MUTATION',
        metadata: expect.objectContaining({ operation: 'DELETE' }),
      }),
    );
  });
});
