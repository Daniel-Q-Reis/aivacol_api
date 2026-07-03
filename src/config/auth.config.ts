export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAuthConfig(): AuthConfig {
  return {
    jwtSecret: getRequiredEnv('JWT_SECRET'),
    jwtExpiresIn: getRequiredEnv('JWT_EXPIRES_IN'),
  };
}
