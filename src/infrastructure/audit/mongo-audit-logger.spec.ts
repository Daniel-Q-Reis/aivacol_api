import { Model } from 'mongoose';
import { MongoAuditLogger } from './mongo-audit-logger';
import { AuditLogDocument } from './schemas/audit-log.schema';

describe('MongoAuditLogger', () => {
  let auditModel: jest.Mocked<Pick<Model<AuditLogDocument>, 'create'>>;
  let logger: MongoAuditLogger;

  beforeEach(() => {
    auditModel = {
      create: jest.fn(),
    };

    logger = new MongoAuditLogger(auditModel as unknown as Model<AuditLogDocument>);
  });

  it('persists audit entry with fallback timestamp', async () => {
    auditModel.create.mockResolvedValue({} as never);

    await logger.log({
      action: 'READ',
      entity: 'VEHICLE',
      entityId: 'veh-1',
      userId: 'user-1',
      metadata: { source: 'api' },
      changes: { year: 2024 },
    });

    expect(auditModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'READ',
        entity: 'VEHICLE',
        timestamp: expect.any(Date),
      }),
    );
  });

  it('swallows persistence errors to keep transaction path resilient', async () => {
    auditModel.create.mockRejectedValue(new Error('mongo down'));

    await expect(
      logger.log({ action: 'AUTH', entity: 'AUTH', metadata: { outcome: 'LOGIN_FAILED' } }),
    ).resolves.toBeUndefined();
  });
});
