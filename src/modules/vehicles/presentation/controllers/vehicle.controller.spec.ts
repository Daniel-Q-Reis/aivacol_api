import { VehicleController } from './vehicle.controller';
import { VehicleService } from '../../application/services/vehicle.service';

describe('VehicleController', () => {
  let service: jest.Mocked<VehicleService>;
  let controller: VehicleController;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<VehicleService>;
    controller = new VehicleController(service);
  });

  it('resolves actor id from userId claim and delegates create', async () => {
    service.create.mockResolvedValue({ id: 'v1' } as any);

    await controller.create(
      {
        licensePlate: 'ABC1D23',
        chassis: '9BWZZZ377VT004251',
        renavam: '00123456789',
        year: 2024,
        modelId: 'm1',
      },
      'user-1',
      'sub-1',
      'cid-1',
    );

    expect(service.create).toHaveBeenCalledWith(expect.any(Object), 'user-1', 'cid-1');
  });

  it('falls back to sub claim when userId is missing', async () => {
    service.update.mockResolvedValue({ id: 'v1' } as any);

    await controller.update('v1', { year: 2025 }, undefined as any, 'sub-legacy', 'cid-2');

    expect(service.update).toHaveBeenCalledWith('v1', { year: 2025 }, 'sub-legacy', 'cid-2');
  });

  it('returns standardized delete message', async () => {
    service.delete.mockResolvedValue(undefined);

    const result = await controller.delete('v1', 'user-1', 'sub-1', 'cid-3');

    expect(result).toEqual({ message: 'Veículo removido com sucesso' });
  });
});
