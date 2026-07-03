import dataSource, { getDatabaseConfig, getTypeOrmModuleOptions } from './database.config';

describe('database config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DB_HOST: 'sqlserver',
      DB_PORT: '1433',
      DB_USERNAME: 'sa',
      DB_PASSWORD: 'pass',
      DB_DATABASE: 'fleet',
      DB_POOL_MIN: '2',
      DB_POOL_MAX: '10',
      DB_CONNECTION_TIMEOUT_MS: '30000',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('builds deterministic typeorm datasource options', () => {
    const cfg = getDatabaseConfig() as any;

    expect(cfg.type).toBe('mssql');
    expect(cfg.host).toBe('sqlserver');
    expect(cfg.port).toBe(1433);
    expect((cfg as any).pool).toEqual({ min: 2, max: 10 });
  });

  it('returns module options and initialized datasource instance', () => {
    const moduleOptions = getTypeOrmModuleOptions();

    expect(moduleOptions.type).toBe('mssql');
    expect(dataSource.options.type).toBe('mssql');
  });

  it('fails fast for invalid numeric env vars', () => {
    process.env.DB_PORT = 'abc';

    expect(() => getDatabaseConfig()).toThrow(
      'Environment variable DB_PORT must be a valid number',
    );
  });

  it('throws when required env var is missing', () => {
    delete process.env.DB_HOST;

    expect(() => getDatabaseConfig()).toThrow('Missing required environment variable: DB_HOST');
  });
});
