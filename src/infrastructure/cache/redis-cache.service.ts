import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ICacheService } from '../../common/domain/interfaces/cache-service.interface';
import { CacheConfig, getCacheConfig } from '../../config/cache.config';

@Injectable()
export class RedisCacheService implements ICacheService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly config: CacheConfig = getCacheConfig();
  private client: Redis | null = null;

  onModuleInit(): void {
    this.client = new Redis({
      host: this.config.host,
      port: this.config.port,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
    });

    // Cache is an optimization layer; we intentionally avoid throwing to preserve CRUD availability.
    void this.client.connect().catch((error: unknown) => {
      this.logger.warn(
        `Redis connection unavailable during bootstrap: ${this.getErrorMessage(error)}`,
      );
    });

    (globalThis as Record<string, unknown>).__aivacolRedisClient = this.client;
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      const value = await client.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Redis get failed for key '${key}': ${this.getErrorMessage(error)}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlInSeconds?: number): Promise<void> {
    try {
      const client = await this.getClient();
      const ttl = ttlInSeconds ?? this.config.ttlSeconds;
      await client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      this.logger.warn(`Redis set failed for key '${key}': ${this.getErrorMessage(error)}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.del(key);
    } catch (error) {
      this.logger.warn(`Redis del failed for key '${key}': ${this.getErrorMessage(error)}`);
    }
  }

  async delByPattern(pattern: string): Promise<number> {
    try {
      const client = await this.getClient();
      let cursor = '0';
      let removed = 0;

      do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
        cursor = nextCursor;

        if (keys.length > 0) {
          removed += await client.del(...keys);
        }
      } while (cursor !== '0');

      return removed;
    } catch (error) {
      this.logger.warn(
        `Redis delByPattern failed for pattern '${pattern}': ${this.getErrorMessage(error)}`,
      );
      return 0;
    }
  }

  private async getClient(): Promise<Redis> {
    if (!this.client) {
      this.onModuleInit();
    }

    if (!this.client) {
      throw new Error('Redis client unavailable');
    }

    if (this.client.status !== 'ready' && this.client.status !== 'connect') {
      await this.client.connect();
    }

    return this.client;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
