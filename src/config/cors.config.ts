export interface CorsConfig {
  allowlist: string[];
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function getCorsConfig(): CorsConfig {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) {
    throw new Error('Missing required environment variable: CORS_ORIGINS');
  }

  const allowlist = splitCsv(raw);
  if (allowlist.length === 0) {
    throw new Error('CORS_ORIGINS must contain at least one valid origin');
  }

  return { allowlist };
}
