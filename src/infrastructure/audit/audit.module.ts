import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AUDIT_LOGGER } from '../../common/domain/interfaces/audit-logger.interface';
import { ServiceAuditListener } from './listeners/service-audit.listener';
import { MongoAuditLogger } from './mongo-audit-logger';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AuditLog.name,
        schema: AuditLogSchema,
      },
    ]),
  ],
  providers: [
    MongoAuditLogger,
    ServiceAuditListener,
    {
      provide: AUDIT_LOGGER,
      useExisting: MongoAuditLogger,
    },
  ],
  exports: [AUDIT_LOGGER, MongoAuditLogger],
})
export class AuditModule {}
