export const AUDIT_LOGGER = Symbol('AUDIT_LOGGER');

export type AuditActionType = 'AUTH' | 'READ' | 'MUTATION';

export interface AuditLogEntry {
  action: AuditActionType;
  entity: string;
  entityId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface IAuditLogger {
  log(entry: AuditLogEntry): Promise<void>;
}
