import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../domain/exceptions/domain.exception';
import { ERROR_CATALOG, ErrorCode } from '../errors/error-catalog';
import { CORRELATION_ID_REQUEST_KEY } from '../constants/http-context.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

interface ErrorHttpResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  correlationId: string;
  code?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<AuthenticatedRequest>();
    const response = context.getResponse<Response>();

    const path = request.originalUrl ?? request.url;
    const correlationId = request[CORRELATION_ID_REQUEST_KEY] ?? 'n/a';
    const timestamp = new Date().toISOString();

    const payload = this.mapException(exception, path, correlationId, timestamp);

    if (exception instanceof Error && exception.stack) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error('Unknown exception captured by global filter');
    }

    response.status(payload.statusCode).json(payload);
  }

  private mapException(
    exception: unknown,
    path: string,
    correlationId: string,
    timestamp: string,
  ): ErrorHttpResponse {
    if (exception instanceof DomainException) {
      const catalogEntry = this.getCatalogByCode(exception.code);

      return {
        statusCode: catalogEntry?.statusCode ?? exception.statusCode,
        message: catalogEntry?.message ?? exception.message,
        timestamp,
        path,
        correlationId,
        code: exception.code,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const { message, code } = this.extractHttpExceptionDetails(statusCode, exceptionResponse);

      return {
        statusCode,
        message,
        timestamp,
        path,
        correlationId,
        ...(code ? { code } : {}),
      };
    }

    const fallback = ERROR_CATALOG.INTERNAL_SERVER_ERROR;
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: fallback.message,
      timestamp,
      path,
      correlationId,
      code: fallback.code,
    };
  }

  private extractHttpExceptionDetails(
    statusCode: number,
    exceptionResponse: string | object,
  ): { message: string; code?: string } {
    const defaultCode = this.getCodeByStatus(statusCode);
    const defaultMessage = defaultCode ? ERROR_CATALOG[defaultCode].message : 'Erro na requisição';
    const responseObject = this.asRecord(exceptionResponse);
    const explicitCode = this.normalizeCode(
      typeof exceptionResponse === 'string' ? undefined : responseObject?.code,
    );

    if (typeof exceptionResponse === 'string') {
      const message = this.shouldUseCatalogMessage(exceptionResponse)
        ? defaultMessage
        : exceptionResponse;

      return { message, code: explicitCode ?? defaultCode ?? undefined };
    }

    const parsedMessage = this.normalizeMessage(responseObject?.message);
    const message =
      parsedMessage && !this.shouldUseCatalogMessage(parsedMessage)
        ? parsedMessage
        : defaultMessage;
    const code = explicitCode ?? defaultCode ?? undefined;

    return { message, code };
  }

  private normalizeMessage(raw: unknown): string | null {
    if (typeof raw === 'string') {
      return raw;
    }

    if (Array.isArray(raw) && raw.length > 0) {
      const firstMessage = raw[0];
      return typeof firstMessage === 'string' ? firstMessage : null;
    }

    return null;
  }

  private normalizeCode(raw: unknown): string | null {
    return typeof raw === 'string' ? raw : null;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object') {
      return value as Record<string, unknown>;
    }

    return null;
  }

  private shouldUseCatalogMessage(message: string): boolean {
    const normalized = message.trim().toLowerCase();

    // Normalize framework-native English messages into stable PT-BR API contract responses.
    return (
      normalized === 'unauthorized' ||
      normalized === 'forbidden' ||
      normalized === 'too many requests' ||
      normalized === 'throttlerexception: too many requests'
    );
  }

  private getCodeByStatus(statusCode: number): ErrorCode | null {
    switch (statusCode) {
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      default:
        return null;
    }
  }

  private getCatalogByCode(code: string): (typeof ERROR_CATALOG)[ErrorCode] | null {
    if (code in ERROR_CATALOG) {
      return ERROR_CATALOG[code as ErrorCode];
    }

    return null;
  }
}
