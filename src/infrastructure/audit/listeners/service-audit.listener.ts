import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AUDIT_LOGGER,
  AuditLogEntry,
  IAuditLogger,
} from '../../../common/domain/interfaces/audit-logger.interface';

@Injectable()
export class ServiceAuditListener {
  private readonly logger = new Logger(ServiceAuditListener.name);

  constructor(@Inject(AUDIT_LOGGER) private readonly auditLogger: IAuditLogger) {}

  @OnEvent('audit.service_interaction', { async: true })
  async onServiceInteraction(event: AuditLogEntry): Promise<void> {
    try {
      await this.auditLogger.log(event);
    } catch (error) {
      // Listener is fire-and-forget by design; rethrowing here would incorrectly couple CRUD success to audit infra.
      this.logger.error(`Service audit listener failed: ${this.getErrorMessage(error)}`);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
