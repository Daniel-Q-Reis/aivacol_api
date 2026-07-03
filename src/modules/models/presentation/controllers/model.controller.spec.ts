import { ModelController } from './model.controller';
import { ModelService } from '../../application/services/model.service';

describe('ModelController', () => {
  let service: jest.Mocked<ModelService>;
  let controller: ModelController;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ModelService>;
    controller = new ModelController(service);
  });

  it('delegates create/update/delete with userId fallback to sub', async () => {
    service.create.mockResolvedValue({ id: 'm1' } as any);
    service.update.mockResolvedValue({ id: 'm1' } as any);
    service.delete.mockResolvedValue(undefined);

    await controller.create({ name: 'Corolla', brandId: 'b1' }, undefined as any, 'sub-1', 'cid-1');
    await controller.update('m1', { name: 'Corolla Cross' }, undefined as any, 'sub-1', 'cid-2');
    const remove = await controller.delete('m1', undefined as any, 'sub-1', 'cid-3');

    expect(service.create).toHaveBeenCalledWith(
      { name: 'Corolla', brandId: 'b1' },
      'sub-1',
      'cid-1',
    );
    expect(service.update).toHaveBeenCalledWith('m1', { name: 'Corolla Cross' }, 'sub-1', 'cid-2');
    expect(service.delete).toHaveBeenCalledWith('m1', 'sub-1', 'cid-3');
    expect(remove).toEqual({ message: 'Modelo removido com sucesso' });
  });
});
