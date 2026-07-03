import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { CorrelationIdInterceptor } from './correlation-id.interceptor';

describe('CorrelationIdInterceptor', () => {
  let interceptor: CorrelationIdInterceptor;

  beforeEach(() => {
    interceptor = new CorrelationIdInterceptor();
  });

  it('keeps existing request correlationId and sets response header', (done) => {
    const setHeader = jest.fn();
    const request = { correlationId: 'cid-existing', header: jest.fn() };
    const response = { setHeader };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, { handle: () => of('ok') } as CallHandler).subscribe({
      complete: () => {
        expect(request.correlationId).toBe('cid-existing');
        expect(setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'cid-existing');
        done();
      },
    });
  });

  it('uses incoming header when request has no correlationId', (done) => {
    const setHeader = jest.fn();
    const request = { header: jest.fn().mockReturnValue('cid-header') } as any;
    const response = { setHeader };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, { handle: () => of('ok') } as CallHandler).subscribe({
      complete: () => {
        expect(request.correlationId).toBe('cid-header');
        done();
      },
    });
  });

  it('falls back to generated UUID when no header is present', (done) => {
    const setHeader = jest.fn();
    const request = { header: jest.fn().mockReturnValue(undefined) } as any;
    const response = { setHeader };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, { handle: () => of('ok') } as CallHandler).subscribe({
      complete: () => {
        expect(typeof request.correlationId).toBe('string');
        expect(request.correlationId.length).toBeGreaterThan(10);
        expect(setHeader).toHaveBeenCalledWith('X-Correlation-ID', request.correlationId);
        done();
      },
    });
  });

  it('bypasses assignment when context has no request/response', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => null,
        getResponse: () => null,
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, { handle: () => of('ok') } as CallHandler).subscribe({
      complete: () => done(),
      error: done,
    });
  });
});
