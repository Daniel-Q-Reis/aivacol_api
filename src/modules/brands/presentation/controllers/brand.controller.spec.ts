import { BrandController } from './brand.controller';
import { BrandService } from '../../application/services/brand.service';

describe('BrandController', () => {
  let service: jest.Mocked<BrandService>;
  let controller: BrandController;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<BrandService>;
    controller = new BrandController(service);
  });

  it('delegates create/update/delete with claim fallback and returns delete message', async () => {
    service.create.mockResolvedValue({ id: 'b1' } as any);
    service.update.mockResolvedValue({ id: 'b1' } as any);
    service.delete.mockResolvedValue(undefined);

    await controller.create({ name: 'Toyota' }, undefined as any, 'sub-1', 'cid-1');
    await controller.update('b1', { name: 'Toyota Motor' }, undefined as any, 'sub-1', 'cid-2');
    const remove = await controller.delete('b1', undefined as any, 'sub-1', 'cid-3');

    expect(service.create).toHaveBeenCalledWith({ name: 'Toyota' }, 'sub-1', 'cid-1');
    expect(service.update).toHaveBeenCalledWith('b1', { name: 'Toyota Motor' }, 'sub-1', 'cid-2');
    expect(service.delete).toHaveBeenCalledWith('b1', 'sub-1', 'cid-3');
    expect(remove).toEqual({ message: 'Marca removida com sucesso' });
  });
});
