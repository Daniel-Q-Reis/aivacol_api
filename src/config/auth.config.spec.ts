import { getAuthConfig } from './auth.config';

describe('auth config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('reads required auth variables', () => {
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_EXPIRES_IN = '1h';

    expect(getAuthConfig()).toEqual({ jwtSecret: 'secret', jwtExpiresIn: '1h' });
  });

  it('fails fast when required variables are missing', () => {
    delete process.env.JWT_SECRET;
    process.env.JWT_EXPIRES_IN = '1h';

    expect(() => getAuthConfig()).toThrow('Missing required environment variable: JWT_SECRET');
  });
});
