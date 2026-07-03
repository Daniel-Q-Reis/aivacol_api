import { Request } from 'express';

export interface JwtUserPayload {
  userId?: string;
  sub?: string;
  id?: string;
  nickname?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  correlationId?: string;
  user?: JwtUserPayload;
}
