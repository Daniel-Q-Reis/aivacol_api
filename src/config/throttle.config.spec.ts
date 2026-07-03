import { getThrottleConfig } from './throttle.config';

describe('throttle config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses defaults when values are missing', () => {
    delete process.env.THROTTLE_TTL_SECONDS;
    delete process.env.THROTTLE_LIMIT;

    expect(getThrottleConfig()).toEqual({ ttlSeconds: 60, limit: 100 });
  });

  it('throws for non-positive ttl and limit', () => {
    process.env.THROTTLE_TTL_SECONDS = '0';
    process.env.THROTTLE_LIMIT = '10';
    expect(() => getThrottleConfig()).toThrow('THROTTLE_TTL_SECONDS must be greater than zero');

    process.env.THROTTLE_TTL_SECONDS = '60';
    process.env.THROTTLE_LIMIT = '0';
    expect(() => getThrottleConfig()).toThrow('THROTTLE_LIMIT must be greater than zero');
  });
});
