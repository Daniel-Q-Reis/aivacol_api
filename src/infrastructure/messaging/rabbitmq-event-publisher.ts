import { Inject, Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  IEventPublisher,
  PublishEventOptions,
} from '../../common/domain/interfaces/event-publisher.interface';

const EXCHANGE_NAME = 'fleet-events';
const DLQ_ROUTING_SUFFIX = '.dlq';
const MAX_RETRY_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 200;

@Injectable()
export class RabbitmqEventPublisher implements IEventPublisher {
  private readonly logger = new Logger(RabbitmqEventPublisher.name);

  constructor(@Inject(AmqpConnection) private readonly amqpConnection: AmqpConnection) {
    (globalThis as Record<string, unknown>).__aivacolRabbitConnection = amqpConnection;
  }

  async publish<TPayload>(
    routingKey: string,
    payload: TPayload,
    options?: PublishEventOptions,
  ): Promise<void> {
    const occurredAt = options?.occurredAt ?? new Date().toISOString();
    const message = {
      eventId: options?.eventId,
      correlationId: options?.correlationId,
      occurredAt,
      payload,
    };

    try {
      await this.publishWithRetry(routingKey, message);
    } catch (error) {
      this.logger.error(
        `Primary publish failed for '${routingKey}', routing to DLQ: ${this.getErrorMessage(error)}`,
      );

      try {
        await this.publishWithRetry(`${routingKey}${DLQ_ROUTING_SUFFIX}`, message);
      } catch (dlqError) {
        this.logger.error(
          `DLQ publish failed for '${routingKey}': ${this.getErrorMessage(dlqError)}`,
        );
      }
    }
  }

  private async publishWithRetry(
    routingKey: string,
    message: Record<string, unknown>,
  ): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
      try {
        // We rely on publisher confirms to treat successful await as broker-acknowledged persistence.
        await this.amqpConnection.publish(EXCHANGE_NAME, routingKey, message, {
          mandatory: true,
          persistent: true,
          contentType: 'application/json',
        });

        return;
      } catch (error) {
        lastError = error;

        if (attempt < MAX_RETRY_ATTEMPTS) {
          const waitMs = BASE_BACKOFF_MS * 2 ** (attempt - 1);
          await this.delay(waitMs);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Unknown RabbitMQ publish failure');
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
