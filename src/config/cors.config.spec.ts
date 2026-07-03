import { getCorsConfig } from './cors.config';

describe('cors config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('parses comma-separated allowlist values', () => {
    process.env.CORS_ORIGINS = 'http://localhost:3000, https://app.example.com';

    expect(getCorsConfig()).toEqual({
      allowlist: ['http://localhost:3000', 'https://app.example.com'],
    });
  });

  it('throws when allowlist is missing or empty', () => {
    delete process.env.CORS_ORIGINS;
    expect(() => getCorsConfig()).toThrow('Missing required environment variable: CORS_ORIGINS');

    process.env.CORS_ORIGINS = ' , '; // only empty entries after trimming
    expect(() => getCorsConfig()).toThrow('CORS_ORIGINS must contain at least one valid origin');
  });
});
