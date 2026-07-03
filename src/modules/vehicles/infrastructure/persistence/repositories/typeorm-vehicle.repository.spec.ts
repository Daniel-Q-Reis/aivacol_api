import { Repository } from 'typeorm';
import { VehicleMapper } from '../../../application/mappers/vehicle.mapper';
import { VehicleOrmEntity } from '../entities/vehicle.orm-entity';
import { TypeOrmVehicleRepository } from './typeorm-vehicle.repository';

describe('TypeOrmVehicleRepository', () => {
  let ormRepository: jest.Mocked<Repository<VehicleOrmEntity>>;
  let repository: TypeOrmVehicleRepository;

  const makeOrmVehicle = (id = '8f078a37-902b-4995-a8d7-01f27f78f5ec'): VehicleOrmEntity =>
    ({
      id,
      licensePlate: 'ABC1D23',
      chassis: '9BWZZZ377VT004251',
      renavam: '00123456789',
      year: 2024,
      modelId: '95ed4e9d-dd24-4515-af2d-d1dc6f5fbc59',
      createdBy: '401df3f4-aa72-4c66-ad87-30d89ea09d14',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
    }) as VehicleOrmEntity;

  beforeEach(() => {
    ormRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<Repository<VehicleOrmEntity>>;

    repository = new TypeOrmVehicleRepository(ormRepository);
  });

  it('findById returns mapped domain entity when found', async () => {
    ormRepository.findOne.mockResolvedValue(makeOrmVehicle());

    const found = await repository.findById('8f078a37-902b-4995-a8d7-01f27f78f5ec');

    expect(found?.id).toBe('8f078a37-902b-4995-a8d7-01f27f78f5ec');
    expect(found?.licensePlate.getValue()).toBe('ABC1D23');
  });

  it('findById returns null when not found', async () => {
    ormRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('findAll applies pagination/sort and maps items', async () => {
    ormRepository.findAndCount.mockResolvedValue([[makeOrmVehicle()], 1]);

    const result = await repository.findAll({ page: 2, limit: 10, sort: 'year', order: 'asc' });

    expect(result.total).toBe(1);
    expect(result.items[0].id).toBeDefined();
    expect(ormRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10, order: { year: 'ASC' } }),
    );
  });

  it('findByLicensePlate/findByChassis/findByRenavam normalize lookup values', async () => {
    ormRepository.findOne.mockResolvedValue(makeOrmVehicle());

    await repository.findByLicensePlate('abc1d23');
    await repository.findByChassis('9bwzzz377vt004251');
    await repository.findByRenavam('00123456789');

    expect(ormRepository.findOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: expect.objectContaining({ licensePlate: 'ABC1D23' }) }),
    );
    expect(ormRepository.findOne).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ chassis: '9BWZZZ377VT004251' }) }),
    );
    expect(ormRepository.findOne).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ where: expect.objectContaining({ renavam: '00123456789' }) }),
    );
  });

  it('create and update persist mapped entities and return domain', async () => {
    const domain = VehicleMapper.createDomainFromPrimitives({
      id: '8f078a37-902b-4995-a8d7-01f27f78f5ec',
      licensePlate: 'ABC1D23',
      chassis: '9BWZZZ377VT004251',
      renavam: '00123456789',
      year: 2024,
      modelId: '95ed4e9d-dd24-4515-af2d-d1dc6f5fbc59',
      createdBy: '401df3f4-aa72-4c66-ad87-30d89ea09d14',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    ormRepository.save.mockResolvedValue(makeOrmVehicle(domain.id));

    const created = await repository.create(domain);
    const updated = await repository.update(domain);

    expect(created.id).toBe(domain.id);
    expect(updated.id).toBe(domain.id);
    expect(ormRepository.save).toHaveBeenCalledTimes(2);
  });

  it('delete performs soft delete only', async () => {
    ormRepository.softDelete.mockResolvedValue({} as never);

    await repository.delete('8f078a37-902b-4995-a8d7-01f27f78f5ec');

    expect(ormRepository.softDelete).toHaveBeenCalledWith({
      id: '8f078a37-902b-4995-a8d7-01f27f78f5ec',
    });
  });
});
