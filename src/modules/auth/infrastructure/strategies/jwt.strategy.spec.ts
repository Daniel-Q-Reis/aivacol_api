import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('normalizes payload and ensures userId fallback to sub', () => {
    const strategy = new JwtStrategy();

    expect(strategy.validate({ sub: 'user-1', nickname: 'aivacol' })).toEqual(
      expect.objectContaining({ sub: 'user-1', userId: 'user-1', nickname: 'aivacol' }),
    );

    expect(strategy.validate({ userId: 'user-2', sub: 'legacy-sub' })).toEqual(
      expect.objectContaining({ userId: 'user-2', sub: 'legacy-sub' }),
    );
  });
});
