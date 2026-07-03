import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import {
  CORRELATION_ID_HEADER,
  CORRELATION_ID_REQUEST_KEY,
} from '../constants/http-context.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const request = req as AuthenticatedRequest;
    const incomingCorrelationId = req.header(CORRELATION_ID_HEADER);
    const correlationId = incomingCorrelationId?.trim() || randomUUID();

    request[CORRELATION_ID_REQUEST_KEY] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
