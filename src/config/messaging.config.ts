export interface MessagingConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  uri: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getNumberEnv(name: string, fallback?: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error(`Missing required numeric environment variable: ${name}`);
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return parsed;
}

export function getMessagingConfig(): MessagingConfig {
  const host = getRequiredEnv('RABBITMQ_HOST');
  const port = getNumberEnv('RABBITMQ_PORT', 5672);
  const username = getRequiredEnv('RABBITMQ_USER');
  const password = getRequiredEnv('RABBITMQ_PASS');

  return {
    host,
    port,
    username,
    password,
    // Keep canonical AMQP URI in one place to avoid connection-string drift.
    uri: `amqp://${username}:${password}@${host}:${port}`,
  };
}
