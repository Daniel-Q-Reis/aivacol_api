export interface CacheConfig {
  host: string;
  port: number;
  ttlSeconds: number;
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

export function getCacheConfig(): CacheConfig {
  return {
    host: getRequiredEnv('REDIS_HOST'),
    port: getNumberEnv('REDIS_PORT', 6379),
    // CACHE_TTL is standardized in seconds across cache use cases.
    ttlSeconds: getNumberEnv('CACHE_TTL', 300),
  };
}
