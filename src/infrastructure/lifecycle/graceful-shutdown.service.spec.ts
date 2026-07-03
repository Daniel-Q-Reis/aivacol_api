import { DataSource } from 'typeorm';
import { Connection } from 'mongoose';
import { GracefulShutdownService } from './graceful-shutdown.service';

describe('GracefulShutdownService', () => {
  it('closes sql, mongo, redis, and rabbit connections when present', async () => {
    const dataSource = {
      isInitialized: true,
      destroy: jest.fn().mockResolvedValue(undefined),
    } as unknown as DataSource;

    const mongoConnection = {
      readyState: 1,
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as Connection;

    (globalThis as any).__aivacolRedisClient = {
      quit: jest.fn().mockResolvedValue(undefined),
    };
    (globalThis as any).__aivacolRabbitConnection = {
      close: jest.fn().mockResolvedValue(undefined),
    };

    const service = new GracefulShutdownService(dataSource, mongoConnection);
    await service.onApplicationShutdown('SIGTERM');

    expect(dataSource.destroy as jest.Mock).toHaveBeenCalled();
    expect(mongoConnection.close as jest.Mock).toHaveBeenCalled();
    expect((globalThis as any).__aivacolRedisClient.quit).toHaveBeenCalled();
    expect((globalThis as any).__aivacolRabbitConnection.close).toHaveBeenCalled();
  });

  it('handles missing optional connectors without throwing', async () => {
    const dataSource = {
      isInitialized: false,
      destroy: jest.fn(),
    } as unknown as DataSource;
    const mongoConnection = {
      readyState: 0,
      close: jest.fn(),
    } as unknown as Connection;

    delete (globalThis as any).__aivacolRedisClient;
    delete (globalThis as any).__aivacolRabbitConnection;

    const service = new GracefulShutdownService(dataSource, mongoConnection);

    await expect(service.onApplicationShutdown()).resolves.toBeUndefined();
  });
});
