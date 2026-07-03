import { AddressInfo, createServer } from 'node:net';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('HealthController', () => {
  let dataSource: jest.Mocked<DataSource>;
  let controller: HealthController;

  beforeEach(() => {
    dataSource = {
      query: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;

    controller = new HealthController(dataSource);

    process.env.REDIS_HOST = 'redis';
    process.env.REDIS_PORT = '6379';
    process.env.CACHE_TTL = '300';
    process.env.RABBITMQ_HOST = 'rabbitmq';
    process.env.RABBITMQ_PORT = '5672';
    process.env.RABBITMQ_USER = 'guest';
    process.env.RABBITMQ_PASS = 'guest';
    process.env.MONGO_URI = 'mongodb://localhost:27017/aivacol_audit';
  });

  it('returns ok when all connectors are up', async () => {
    jest.spyOn(controller as any, 'checkSqlServer').mockResolvedValue({ status: 'up' });
    jest.spyOn(controller as any, 'checkRedis').mockResolvedValue({ status: 'up' });
    jest.spyOn(controller as any, 'checkRabbitMq').mockResolvedValue({ status: 'up' });
    jest.spyOn(controller as any, 'checkMongoDb').mockResolvedValue({ status: 'up' });

    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.connectors.sqlServer.status).toBe('up');
  });

  it('returns degraded when any connector is down', async () => {
    jest.spyOn(controller as any, 'checkSqlServer').mockResolvedValue({ status: 'up' });
    jest.spyOn(controller as any, 'checkRedis').mockResolvedValue({ status: 'down' });
    jest.spyOn(controller as any, 'checkRabbitMq').mockResolvedValue({ status: 'up' });
    jest.spyOn(controller as any, 'checkMongoDb').mockResolvedValue({ status: 'up' });

    const result = await controller.getHealth();

    expect(result.status).toBe('degraded');
  });

  it('checks sqlserver connector success and failure paths', async () => {
    dataSource.query.mockResolvedValueOnce([{ ok: 1 }] as never);
    await expect((controller as any).checkSqlServer()).resolves.toEqual({ status: 'up' });

    dataSource.query.mockRejectedValueOnce(new Error('db down'));
    await expect((controller as any).checkSqlServer()).resolves.toEqual(
      expect.objectContaining({ status: 'down', detail: 'db down' }),
    );
  });

  it('checks redis connector success path and always closes client', async () => {
    const client = {
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK'),
    };

    (Redis as unknown as jest.Mock).mockImplementation(() => client);

    await expect((controller as any).checkRedis()).resolves.toEqual({ status: 'up' });
    expect(client.connect).toHaveBeenCalled();
    expect(client.ping).toHaveBeenCalled();
    expect(client.quit).toHaveBeenCalled();
  });

  it('checks redis connector failure path', async () => {
    const client = {
      connect: jest.fn().mockRejectedValue(new Error('redis down')),
      ping: jest.fn(),
      quit: jest.fn().mockRejectedValue(new Error('quit failed')),
    };

    (Redis as unknown as jest.Mock).mockImplementation(() => client);

    await expect((controller as any).checkRedis()).resolves.toEqual(
      expect.objectContaining({ status: 'down', detail: 'redis down' }),
    );
    expect(client.quit).toHaveBeenCalled();
  });

  it('checks rabbitmq connector success and failure paths', async () => {
    const tcpProbe = jest
      .spyOn(controller as any, 'assertTcpConnection')
      .mockResolvedValue(undefined);

    await expect((controller as any).checkRabbitMq()).resolves.toEqual({ status: 'up' });
    expect(tcpProbe).toHaveBeenCalledWith('rabbitmq', 5672);

    tcpProbe.mockRejectedValueOnce(new Error('amqp down'));

    await expect((controller as any).checkRabbitMq()).resolves.toEqual(
      expect.objectContaining({ status: 'down', detail: 'amqp down' }),
    );
  });

  it('checks mongodb connector success and failure paths', async () => {
    const tcpProbe = jest
      .spyOn(controller as any, 'assertTcpConnection')
      .mockResolvedValue(undefined);

    await expect((controller as any).checkMongoDb()).resolves.toEqual({ status: 'up' });
    expect(tcpProbe).toHaveBeenCalledWith('localhost', 27017);

    tcpProbe.mockRejectedValueOnce(new Error('mongo down'));

    await expect((controller as any).checkMongoDb()).resolves.toEqual(
      expect.objectContaining({ status: 'down', detail: 'mongo down' }),
    );
  });

  it('returns unknown error message for non-Error values', () => {
    expect((controller as any).getErrorMessage({ problem: true })).toBe('Unknown error');
  });

  it('opens and fails tcp probe connections', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as AddressInfo).port;

    await expect(
      (controller as any).assertTcpConnection('127.0.0.1', port),
    ).resolves.toBeUndefined();

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    await expect((controller as any).assertTcpConnection('127.0.0.1', port)).rejects.toThrow();
  });
});
