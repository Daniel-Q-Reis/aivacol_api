import { getCacheConfig } from './cache.config';

describe('cache config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      REDIS_HOST: 'redis',
      REDIS_PORT: '6379',
      CACHE_TTL: '300',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('builds redis cache config with defaults', () => {
    delete process.env.REDIS_PORT;
    delete process.env.CACHE_TTL;

    const cfg = getCacheConfig();

    expect(cfg).toEqual({
      host: 'redis',
      port: 6379,
      ttlSeconds: 300,
    });
  });

  it('throws when redis host is missing', () => {
    delete process.env.REDIS_HOST;

    expect(() => getCacheConfig()).toThrow('Missing required environment variable: REDIS_HOST');
  });

  it('throws when redis port is invalid', () => {
    process.env.REDIS_PORT = 'abc';

    expect(() => getCacheConfig()).toThrow(
      'Environment variable REDIS_PORT must be a valid number',
    );
  });
});
