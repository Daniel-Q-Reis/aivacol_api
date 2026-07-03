import { Repository } from 'typeorm';
import { ModelMapper } from '../../../application/mappers/model.mapper';
import { ModelOrmEntity } from '../entities/model.orm-entity';
import { TypeOrmModelRepository } from './typeorm-model.repository';

describe('TypeOrmModelRepository', () => {
  let ormRepository: jest.Mocked<Repository<ModelOrmEntity>>;
  let repository: TypeOrmModelRepository;

  const makeDomainModel = () =>
    ModelMapper.createDomainFromPrimitives({
      id: '0042eff7-a2b7-4db4-a92c-6496325d8e34',
      name: 'Corolla',
      brandId: '4f12d84f-f8f9-4434-87ff-0856f6d7fd6c',
      createdBy: '60f56f73-c1e2-4526-8f05-85e95d9d71a2',
    });

  beforeEach(() => {
    ormRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<Repository<ModelOrmEntity>>;

    repository = new TypeOrmModelRepository(ormRepository);
  });

  it('findById maps active model', async () => {
    ormRepository.findOne.mockResolvedValue(ModelMapper.toOrm(makeDomainModel()));

    const model = await repository.findById('0042eff7-a2b7-4db4-a92c-6496325d8e34');

    expect(model?.id).toBe('0042eff7-a2b7-4db4-a92c-6496325d8e34');
  });

  it('findAll returns sorted models', async () => {
    ormRepository.find.mockResolvedValue([ModelMapper.toOrm(makeDomainModel())]);

    const models = await repository.findAll();

    expect(models).toHaveLength(1);
    expect(ormRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { name: 'ASC' } }),
    );
  });

  it('create/update/delete delegate to ORM repository', async () => {
    const model = makeDomainModel();
    ormRepository.save.mockResolvedValue(ModelMapper.toOrm(model));
    ormRepository.softDelete.mockResolvedValue({} as never);

    await repository.create(model);
    await repository.update(model);
    await repository.delete(model.id);

    expect(ormRepository.save).toHaveBeenCalledTimes(2);
    expect(ormRepository.softDelete).toHaveBeenCalledWith({ id: model.id });
  });
});
