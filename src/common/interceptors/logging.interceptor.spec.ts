import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('logs successful request metadata', (done) => {
    const logSpy = jest
      .spyOn((interceptor as any).logger, 'log')
      .mockImplementation(() => undefined);

    const request = {
      method: 'GET',
      originalUrl: '/api/v1/vehicles',
      user: { userId: 'user-1' },
      correlationId: 'cid-1',
    };
    const response = { statusCode: 200 };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    const next = { handle: () => of({ ok: true }) } as CallHandler;

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"route":"/api/v1/vehicles"'));
      },
      complete: done,
      error: done,
    });
  });

  it('logs error path metadata when downstream throws', (done) => {
    const errorSpy = jest
      .spyOn((interceptor as any).logger, 'error')
      .mockImplementation(() => undefined);

    const request = {
      method: 'POST',
      originalUrl: '/api/v1/vehicles',
      user: { sub: 'user-2' },
      correlationId: 'cid-2',
    };
    const response = { statusCode: 500 };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    const next = { handle: () => throwError(() => new Error('failed')) } as CallHandler;

    interceptor.intercept(context, next).subscribe({
      next: () => done(new Error('Expected observable to fail')),
      error: () => {
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('"statusCode":500'));
        done();
      },
    });
  });

  it('bypasses logging when http request/response are unavailable', (done) => {
    const logSpy = jest
      .spyOn((interceptor as any).logger, 'log')
      .mockImplementation(() => undefined);

    const context = {
      switchToHttp: () => ({
        getRequest: () => null,
        getResponse: () => null,
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, { handle: () => of('ok') } as CallHandler).subscribe({
      complete: () => {
        expect(logSpy).not.toHaveBeenCalled();
        done();
      },
      error: done,
    });
  });

  it('falls back to request.url and null user id when principal is unsupported', (done) => {
    const logSpy = jest
      .spyOn((interceptor as any).logger, 'log')
      .mockImplementation(() => undefined);

    const request = {
      method: 'GET',
      url: '/fallback-route',
      user: { id: 123 },
      correlationId: 'cid-3',
    };
    const response = { statusCode: 204 };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, { handle: () => of('ok') } as CallHandler).subscribe({
      complete: () => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"route":"/fallback-route"'));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"userId":null'));
        done();
      },
      error: done,
    });
  });
});
