import { Repository } from 'typeorm';
import { BrandMapper } from '../../../application/mappers/brand.mapper';
import { BrandOrmEntity } from '../entities/brand.orm-entity';
import { TypeOrmBrandRepository } from './typeorm-brand.repository';

describe('TypeOrmBrandRepository', () => {
  let ormRepository: jest.Mocked<Repository<BrandOrmEntity>>;
  let repository: TypeOrmBrandRepository;

  const makeDomainBrand = () =>
    BrandMapper.createDomainFromPrimitives({
      id: '3321cf97-cfb9-4364-ad7e-39d968ef6e7b',
      name: 'Toyota',
      createdBy: 'ec4f4d0e-53ec-438f-9df2-1150cde57b2e',
    });

  beforeEach(() => {
    ormRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<Repository<BrandOrmEntity>>;

    repository = new TypeOrmBrandRepository(ormRepository);
  });

  it('findById maps active brand', async () => {
    ormRepository.findOne.mockResolvedValue(BrandMapper.toOrm(makeDomainBrand()));

    const brand = await repository.findById('3321cf97-cfb9-4364-ad7e-39d968ef6e7b');

    expect(brand?.id).toBe('3321cf97-cfb9-4364-ad7e-39d968ef6e7b');
  });

  it('findAll returns sorted brands', async () => {
    ormRepository.find.mockResolvedValue([BrandMapper.toOrm(makeDomainBrand())]);

    const brands = await repository.findAll();

    expect(brands).toHaveLength(1);
    expect(ormRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { name: 'ASC' } }),
    );
  });

  it('create/update/delete delegate to ORM repository', async () => {
    const brand = makeDomainBrand();
    ormRepository.save.mockResolvedValue(BrandMapper.toOrm(brand));
    ormRepository.softDelete.mockResolvedValue({} as never);

    await repository.create(brand);
    await repository.update(brand);
    await repository.delete(brand.id);

    expect(ormRepository.save).toHaveBeenCalledTimes(2);
    expect(ormRepository.softDelete).toHaveBeenCalledWith({ id: brand.id });
  });
});
