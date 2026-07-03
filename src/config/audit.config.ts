export interface AuditConfig {
  uri: string;
}

export function getAuditConfig(): AuditConfig {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Missing required environment variable: MONGO_URI');
  }

  return { uri };
}
