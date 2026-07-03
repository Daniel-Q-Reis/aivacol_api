import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';

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

export function getDatabaseConfig(): DataSourceOptions {
  const port = getNumberEnv('DB_PORT', 1433);
  const poolMin = getNumberEnv('DB_POOL_MIN', 2);
  const poolMax = getNumberEnv('DB_POOL_MAX', 10);
  const connectionTimeout = getNumberEnv('DB_CONNECTION_TIMEOUT_MS', 30000);

  const baseDir = __dirname.includes('dist') ? __dirname : join(process.cwd(), 'src', 'config');

  return {
    type: 'mssql',
    host: getRequiredEnv('DB_HOST'),
    port,
    username: getRequiredEnv('DB_USERNAME'),
    password: getRequiredEnv('DB_PASSWORD'),
    database: getRequiredEnv('DB_DATABASE'),
    synchronize: false,
    logging: false,
    // Resolve paths from current runtime context to avoid requiring TS files in plain Node runtime.
    entities: [join(baseDir, '..', '**', '*.orm-entity.{ts,js}')],
    migrations: [join(baseDir, '..', 'infrastructure', 'database', 'migrations', '*.{ts,js}')],
    options: {
      // Local Docker SQL Server runs with self-signed cert by default.
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      min: poolMin,
      max: poolMax,
    },
    extra: {
      connectionTimeout,
    },
  };
}

export function getTypeOrmModuleOptions(): TypeOrmModuleOptions {
  return getDatabaseConfig() as TypeOrmModuleOptions;
}

const dataSource = new DataSource(getDatabaseConfig());

export default dataSource;
