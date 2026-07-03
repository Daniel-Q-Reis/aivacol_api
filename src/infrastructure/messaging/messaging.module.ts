import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EVENT_PUBLISHER } from '../../common/domain/interfaces/event-publisher.interface';
import { getMessagingConfig } from '../../config/messaging.config';
import { RabbitmqEventPublisher } from './rabbitmq-event-publisher';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      useFactory: async () => {
        const config = getMessagingConfig();

        return {
          uri: config.uri,
          connectionInitOptions: { wait: false },
          exchanges: [
            {
              name: 'fleet-events',
              type: 'topic',
              options: { durable: true },
            },
          ],
        };
      },
    }),
  ],
  providers: [
    RabbitmqEventPublisher,
    {
      provide: EVENT_PUBLISHER,
      useExisting: RabbitmqEventPublisher,
    },
  ],
  exports: [EVENT_PUBLISHER, RabbitmqEventPublisher],
})
export class MessagingModule {}
