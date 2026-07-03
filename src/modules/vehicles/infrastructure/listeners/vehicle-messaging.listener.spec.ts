import { IEventPublisher } from '../../../../common/domain/interfaces/event-publisher.interface';
import { VehicleMessagingListener } from './vehicle-messaging.listener';

describe('VehicleMessagingListener', () => {
  let publisher: jest.Mocked<IEventPublisher>;
  let listener: VehicleMessagingListener;

  beforeEach(() => {
    publisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };
    listener = new VehicleMessagingListener(publisher);
  });

  it('publishes vehicle.created with generated event metadata when missing', async () => {
    await listener.onVehicleCreated({
      vehicleId: 'veh-1',
      licensePlate: 'ABC1D23',
      chassis: '9BWZZZ377VT004251',
      renavam: '00123456789',
      modelId: 'model-1',
      year: 2024,
      correlationId: 'cid-1',
    });

    expect(publisher.publish).toHaveBeenCalledWith(
      'vehicle.created',
      expect.objectContaining({
        eventId: expect.any(String),
        occurredAt: expect.any(String),
      }),
      expect.objectContaining({ correlationId: 'cid-1' }),
    );
  });

  it('uses explicit eventId/occurredAt on vehicle.updated when provided', async () => {
    await listener.onVehicleUpdated({
      vehicleId: 'veh-1',
      licensePlate: 'ABC1D23',
      chassis: '9BWZZZ377VT004251',
      renavam: '00123456789',
      modelId: 'model-1',
      year: 2024,
      eventId: 'evt-1',
      occurredAt: '2026-01-01T00:00:00.000Z',
      correlationId: 'cid-2',
    });

    expect(publisher.publish).toHaveBeenCalledWith(
      'vehicle.updated',
      expect.objectContaining({ eventId: 'evt-1', occurredAt: '2026-01-01T00:00:00.000Z' }),
      expect.objectContaining({ eventId: 'evt-1', occurredAt: '2026-01-01T00:00:00.000Z' }),
    );
  });

  it('does not throw when publisher fails', async () => {
    publisher.publish.mockRejectedValueOnce(new Error('broker down'));

    await expect(
      listener.onVehicleCreated({
        vehicleId: 'veh-1',
        licensePlate: 'ABC1D23',
        chassis: '9BWZZZ377VT004251',
        renavam: '00123456789',
        modelId: 'model-1',
        year: 2024,
      }),
    ).resolves.toBeUndefined();
  });
});
