export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');

export interface PublishEventOptions {
  eventId?: string;
  occurredAt?: string;
  correlationId?: string;
}

export interface IEventPublisher {
  // The domain contract keeps routing semantics explicit to avoid leaking broker-specific APIs.
  // `options` standardizes trace metadata so handlers can correlate async side-effects with HTTP requests.
  publish<TPayload>(
    routingKey: string,
    payload: TPayload,
    options?: PublishEventOptions,
  ): Promise<void>;
}
