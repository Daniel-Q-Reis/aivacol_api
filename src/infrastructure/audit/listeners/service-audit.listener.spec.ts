import { IAuditLogger } from '../../../common/domain/interfaces/audit-logger.interface';
import { ServiceAuditListener } from './service-audit.listener';

describe('ServiceAuditListener', () => {
  it('delegates logging when event is received', async () => {
    const logger: jest.Mocked<IAuditLogger> = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const listener = new ServiceAuditListener(logger);
    await listener.onServiceInteraction({ action: 'READ', entity: 'VEHICLE' });

    expect(logger.log).toHaveBeenCalledWith({ action: 'READ', entity: 'VEHICLE' });
  });

  it('does not throw when audit logger fails', async () => {
    const logger: jest.Mocked<IAuditLogger> = {
      log: jest.fn().mockRejectedValue(new Error('mongo unavailable')),
    };

    const listener = new ServiceAuditListener(logger);

    // The listener must preserve fire-and-forget behavior so CRUD never fails due to audit infra outage.
    await expect(
      listener.onServiceInteraction({ action: 'MUTATION', entity: 'VEHICLE' }),
    ).resolves.toBeUndefined();
  });
});
