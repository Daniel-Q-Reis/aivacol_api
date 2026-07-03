import { getMessagingConfig } from './messaging.config';

describe('messaging config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      RABBITMQ_HOST: 'rabbitmq',
      RABBITMQ_PORT: '5672',
      RABBITMQ_USER: 'user',
      RABBITMQ_PASS: 'pass',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('builds canonical amqp config and uri', () => {
    const cfg = getMessagingConfig();

    expect(cfg).toEqual(
      expect.objectContaining({
        host: 'rabbitmq',
        port: 5672,
        username: 'user',
        password: 'pass',
        uri: 'amqp://user:pass@rabbitmq:5672',
      }),
    );
  });

  it('throws on invalid numeric port', () => {
    process.env.RABBITMQ_PORT = 'abc';

    expect(() => getMessagingConfig()).toThrow(
      'Environment variable RABBITMQ_PORT must be a valid number',
    );
  });

  it('throws when required env is missing', () => {
    delete process.env.RABBITMQ_HOST;

    expect(() => getMessagingConfig()).toThrow(
      'Missing required environment variable: RABBITMQ_HOST',
    );
  });
});
