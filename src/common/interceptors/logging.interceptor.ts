import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CORRELATION_ID_REQUEST_KEY } from '../constants/http-context.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuthenticatedRequest>();
    const response = httpContext.getResponse();

    if (!request || !response) {
      return next.handle();
    }

    const method = request.method;
    const route = request.originalUrl ?? request.url;
    const correlationId = request[CORRELATION_ID_REQUEST_KEY] ?? 'n/a';

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              method,
              route,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
              userId: this.getUserId(request),
              correlationId,
            }),
          );
        },
        error: () => {
          this.logger.error(
            JSON.stringify({
              method,
              route,
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
              userId: this.getUserId(request),
              correlationId,
            }),
          );
        },
      }),
    );
  }

  private getUserId(request: AuthenticatedRequest): string | null {
    const user = request.user;

    if (!user) {
      return null;
    }

    const userId = user.userId ?? user.sub ?? user.id;
    return typeof userId === 'string' ? userId : null;
  }
}
