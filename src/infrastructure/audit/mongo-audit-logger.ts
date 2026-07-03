import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { AuditLogEntry, IAuditLogger } from '../../common/domain/interfaces/audit-logger.interface';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class MongoAuditLogger implements IAuditLogger {
  private readonly logger = new Logger(MongoAuditLogger.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.auditLogModel.create({
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId,
        changes: entry.changes,
        metadata: entry.metadata,
        timestamp: entry.timestamp ?? new Date(),
      });
    } catch (error) {
      // Audit is append-only observability data; write failures must not impact business transaction success.
      this.logger.warn(`Mongo audit logging failed: ${this.getErrorMessage(error)}`);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
