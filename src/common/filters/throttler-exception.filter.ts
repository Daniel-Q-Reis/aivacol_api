import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { CORRELATION_ID_REQUEST_KEY } from '../constants/http-context.constants';
import { ERROR_CATALOG } from '../errors/error-catalog';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ThrottlerExceptionFilter.name);

  catch(exception: ThrottlerException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<AuthenticatedRequest>();
    const response = context.getResponse<Response>();
    const error = ERROR_CATALOG.RATE_LIMIT_EXCEEDED;

    if (exception.stack) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      correlationId: request[CORRELATION_ID_REQUEST_KEY] ?? 'n/a',
    });
  }
}
