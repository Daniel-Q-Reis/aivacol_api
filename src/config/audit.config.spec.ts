import { getAuditConfig } from './audit.config';

describe('audit config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns mongo uri', () => {
    process.env.MONGO_URI = 'mongodb://localhost:27017/test';

    expect(getAuditConfig()).toEqual({ uri: 'mongodb://localhost:27017/test' });
  });

  it('throws when mongo uri is missing', () => {
    delete process.env.MONGO_URI;

    expect(() => getAuditConfig()).toThrow('Missing required environment variable: MONGO_URI');
  });
});
