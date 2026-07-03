import { RedisCacheService } from './redis-cache.service';

const mockedRedisInstance = {
  connect: jest.fn(),
  quit: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
  status: 'ready',
};

jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockedRedisInstance),
  };
});

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRedisInstance.status = 'ready';
    mockedRedisInstance.connect.mockResolvedValue(undefined);
    mockedRedisInstance.quit.mockResolvedValue('OK');
    mockedRedisInstance.del.mockResolvedValue(1);
    service = new RedisCacheService();
    service.onModuleInit();
  });

  it('gets JSON value and deserializes payload', async () => {
    mockedRedisInstance.get.mockResolvedValue('{"k":"v"}');

    const value = await service.get<{ k: string }>('my-key');

    expect(value).toEqual({ k: 'v' });
    expect(mockedRedisInstance.get).toHaveBeenCalledWith('my-key');
  });

  it('returns null when key is missing or redis fails', async () => {
    mockedRedisInstance.get.mockResolvedValueOnce(null);
    mockedRedisInstance.get.mockRejectedValueOnce(new Error('redis down'));

    await expect(service.get('empty')).resolves.toBeNull();
    await expect(service.get('err')).resolves.toBeNull();
  });

  it('sets value with default and custom ttl', async () => {
    mockedRedisInstance.set.mockResolvedValue('OK');

    await service.set('k1', { ok: true });
    await service.set('k2', { ok: true }, 10);

    expect(mockedRedisInstance.set).toHaveBeenNthCalledWith(
      1,
      'k1',
      JSON.stringify({ ok: true }),
      'EX',
      300,
    );
    expect(mockedRedisInstance.set).toHaveBeenNthCalledWith(
      2,
      'k2',
      JSON.stringify({ ok: true }),
      'EX',
      10,
    );
  });

  it('deletes a direct key', async () => {
    await service.del('k1');

    expect(mockedRedisInstance.del).toHaveBeenCalledWith('k1');
  });

  it('deletes keys by pattern using scan cursor iteration', async () => {
    mockedRedisInstance.scan
      .mockResolvedValueOnce(['1', ['a', 'b']])
      .mockResolvedValueOnce(['0', ['c']]);
    mockedRedisInstance.del.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    const deleted = await service.delByPattern('vehicles:*');

    expect(deleted).toBe(3);
    expect(mockedRedisInstance.scan).toHaveBeenCalledTimes(2);
    expect(mockedRedisInstance.del).toHaveBeenCalledWith('a', 'b');
    expect(mockedRedisInstance.del).toHaveBeenCalledWith('c');
  });

  it('reconnects client when status is not ready or connect', async () => {
    mockedRedisInstance.status = 'close';
    mockedRedisInstance.get.mockResolvedValue('{"ok":true}');

    await service.get('k1');

    expect(mockedRedisInstance.connect).toHaveBeenCalled();
  });

  it('closes connection gracefully on module destroy', async () => {
    await service.onModuleDestroy();

    expect(mockedRedisInstance.quit).toHaveBeenCalled();
  });
});
