import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqEventPublisher } from './rabbitmq-event-publisher';

describe('RabbitmqEventPublisher', () => {
  let amqpConnection: jest.Mocked<AmqpConnection>;
  let publisher: RabbitmqEventPublisher;

  beforeEach(() => {
    jest.useFakeTimers();
    amqpConnection = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<AmqpConnection>;

    publisher = new RabbitmqEventPublisher(amqpConnection);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('publishes successfully on first attempt with confirm-style options', async () => {
    amqpConnection.publish.mockResolvedValue(undefined as never);

    await publisher.publish('vehicle.created', { id: 'v1' }, { correlationId: 'cid' });

    expect(amqpConnection.publish).toHaveBeenCalledWith(
      'fleet-events',
      'vehicle.created',
      expect.objectContaining({
        correlationId: 'cid',
        payload: { id: 'v1' },
      }),
      expect.objectContaining({
        mandatory: true,
        persistent: true,
        contentType: 'application/json',
      }),
    );
  });

  it('retries transient failures with exponential backoff', async () => {
    amqpConnection.publish
      .mockRejectedValueOnce(new Error('transient-1'))
      .mockRejectedValueOnce(new Error('transient-2'))
      .mockResolvedValueOnce(undefined as never);

    const publishPromise = publisher.publish('vehicle.updated', { id: 'v1' });
    await jest.advanceTimersByTimeAsync(1000);
    await publishPromise;

    expect(amqpConnection.publish).toHaveBeenCalledTimes(3);
  });

  it('routes to DLQ when main route exhausts retries', async () => {
    // First 3 attempts fail on primary routing key, next call succeeds on DLQ routing key.
    amqpConnection.publish
      .mockRejectedValueOnce(new Error('err-1'))
      .mockRejectedValueOnce(new Error('err-2'))
      .mockRejectedValueOnce(new Error('err-3'))
      .mockResolvedValueOnce(undefined as never);

    const publishPromise = publisher.publish('vehicle.created', { id: 'v1' });
    await jest.advanceTimersByTimeAsync(2000);
    await publishPromise;

    expect(amqpConnection.publish).toHaveBeenNthCalledWith(
      4,
      'fleet-events',
      'vehicle.created.dlq',
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('swallows final failure when both primary and DLQ publish fail', async () => {
    amqpConnection.publish.mockRejectedValue(new Error('broker down'));

    const publishPromise = publisher.publish('vehicle.created', { id: 'v1' });
    await jest.advanceTimersByTimeAsync(5000);
    await expect(publishPromise).resolves.toBeUndefined();
  });
});
