import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({
  collection: 'audit_logs',
  versionKey: false,
  timestamps: false,
})
export class AuditLog {
  @Prop({ required: true, enum: ['AUTH', 'READ', 'MUTATION'] })
  action!: 'AUTH' | 'READ' | 'MUTATION';

  @Prop({ required: true, trim: true })
  entity!: string;

  @Prop({ required: false, trim: true })
  entityId?: string;

  @Prop({ required: false, trim: true })
  userId?: string;

  @Prop({ required: true, type: Date, default: () => new Date() })
  timestamp!: Date;

  @Prop({ type: Object, required: false })
  changes?: Record<string, unknown>;

  @Prop({ type: Object, required: false })
  metadata?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ entity: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

const auditTtlDays = Number(process.env.AUDIT_TTL_DAYS ?? 90);
if (Number.isFinite(auditTtlDays) && auditTtlDays > 0) {
  // TTL is configurable to align retention with compliance windows without code redeploy.
  AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: Math.floor(auditTtlDays * 86400) });
}
