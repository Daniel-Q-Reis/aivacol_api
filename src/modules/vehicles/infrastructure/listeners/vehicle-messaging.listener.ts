import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EVENT_PUBLISHER,
  IEventPublisher,
} from '../../../../common/domain/interfaces/event-publisher.interface';

interface VehicleEventPayload {
  vehicleId: string;
  licensePlate: string;
  chassis: string;
  renavam: string;
  modelId: string;
  year: number;
  userId?: string;
  correlationId?: string;
  eventId?: string;
  occurredAt?: string;
}

@Injectable()
export class VehicleMessagingListener {
  private readonly logger = new Logger(VehicleMessagingListener.name);

  constructor(@Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher) {}

  @OnEvent('vehicle.created', { async: true })
  async onVehicleCreated(event: VehicleEventPayload): Promise<void> {
    await this.publish('vehicle.created', event);
  }

  @OnEvent('vehicle.updated', { async: true })
  async onVehicleUpdated(event: VehicleEventPayload): Promise<void> {
    await this.publish('vehicle.updated', event);
  }

  private async publish(routingKey: string, event: VehicleEventPayload): Promise<void> {
    const eventId = event.eventId ?? randomUUID();
    const occurredAt = event.occurredAt ?? new Date().toISOString();

    try {
      await this.eventPublisher.publish(
        routingKey,
        { ...event, eventId, occurredAt },
        {
          eventId,
          occurredAt,
          correlationId: event.correlationId,
        },
      );
    } catch (error) {
      // Never throw from async listeners; vehicle CRUD must succeed even when broker is unavailable.
      this.logger.error(`Vehicle messaging listener failed: ${this.getErrorMessage(error)}`);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
