import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { Socket } from 'node:net';
import { getCacheConfig } from '../../config/cache.config';
import { getMessagingConfig } from '../../config/messaging.config';
import { getAuditConfig } from '../../config/audit.config';

interface ConnectorHealth {
  status: 'up' | 'down' | 'not_configured';
  detail?: string;
}

interface HealthResponse {
  status: 'ok' | 'degraded';
  connectors: {
    sqlServer: ConnectorHealth;
    redis: ConnectorHealth;
    rabbitMq: ConnectorHealth;
    mongoDb: ConnectorHealth;
  };
}

@ApiTags('health')
@ApiBearerAuth('bearer')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Returns health state of available connectors' })
  @ApiResponse({ status: 200, description: 'Health status successfully collected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHealth(): Promise<HealthResponse> {
    const [sqlServer, redis, rabbitMq, mongoDb] = await Promise.all([
      this.checkSqlServer(),
      this.checkRedis(),
      this.checkRabbitMq(),
      this.checkMongoDb(),
    ]);

    const statuses = [sqlServer.status, redis.status, rabbitMq.status, mongoDb.status];
    const hasDownConnector = statuses.includes('down');

    return {
      status: hasDownConnector ? 'degraded' : 'ok',
      connectors: {
        sqlServer,
        redis,
        rabbitMq,
        mongoDb,
      },
    };
  }

  private async checkSqlServer(): Promise<ConnectorHealth> {
    try {
      await this.dataSource.query('SELECT 1 AS ok');
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        detail: this.getErrorMessage(error),
      };
    }
  }

  private async checkRedis(): Promise<ConnectorHealth> {
    let client: Redis | null = null;

    try {
      const cacheConfig = getCacheConfig();
      client = new Redis({
        host: cacheConfig.host,
        port: cacheConfig.port,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });

      await client.connect();
      await client.ping();

      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        detail: this.getErrorMessage(error),
      };
    } finally {
      if (client) {
        await client.quit().catch(() => undefined);
      }
    }
  }

  private async checkRabbitMq(): Promise<ConnectorHealth> {
    try {
      const messagingConfig = getMessagingConfig();

      const url = new URL(messagingConfig.uri);
      const port = Number(url.port || 5672);
      const host = url.hostname;

      await this.assertTcpConnection(host, port);

      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        detail: this.getErrorMessage(error),
      };
    }
  }

  private async checkMongoDb(): Promise<ConnectorHealth> {
    try {
      const auditConfig = getAuditConfig();
      const uri = new URL(auditConfig.uri);
      const host = uri.hostname;
      const port = Number(uri.port || 27017);

      await this.assertTcpConnection(host, port);

      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        detail: this.getErrorMessage(error),
      };
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }

  private async assertTcpConnection(host: string, port: number): Promise<void> {
    const socket = new Socket();

    await new Promise<void>((resolve, reject) => {
      socket.setTimeout(2000);

      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });

      socket.once('error', (err) => {
        socket.destroy();
        reject(err);
      });

      socket.once('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });

      socket.connect(port, host);
    });
  }
}
