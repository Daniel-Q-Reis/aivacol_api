export interface ThrottleConfig {
  ttlSeconds: number;
  limit: number;
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

export function getThrottleConfig(): ThrottleConfig {
  const ttlSeconds = getNumberEnv('THROTTLE_TTL_SECONDS', 60);
  const limit = getNumberEnv('THROTTLE_LIMIT', 100);

  if (ttlSeconds <= 0) {
    throw new Error('THROTTLE_TTL_SECONDS must be greater than zero');
  }

  if (limit <= 0) {
    throw new Error('THROTTLE_LIMIT must be greater than zero');
  }

  return {
    ttlSeconds,
    limit,
  };
}
