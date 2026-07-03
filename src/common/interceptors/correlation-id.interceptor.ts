import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'node:crypto';
import {
  CORRELATION_ID_HEADER,
  CORRELATION_ID_REQUEST_KEY,
} from '../constants/http-context.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuthenticatedRequest>();
    const response = httpContext.getResponse();

    if (!request || !response) {
      return next.handle();
    }

    const incomingHeaderValue = request.header(CORRELATION_ID_HEADER);
    const correlationId =
      request[CORRELATION_ID_REQUEST_KEY] ?? incomingHeaderValue?.trim() ?? randomUUID();

    request[CORRELATION_ID_REQUEST_KEY] = correlationId;
    response.setHeader('X-Correlation-ID', correlationId);

    return next.handle();
  }
}
