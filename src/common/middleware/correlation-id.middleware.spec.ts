import { NextFunction, Request, Response } from 'express';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('uses incoming header correlation id', () => {
    const request = {
      header: jest.fn().mockReturnValue('cid-header'),
    } as unknown as Request;
    const setHeader = jest.fn();
    const response = { setHeader } as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;

    middleware.use(request, response, next);

    expect(setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'cid-header');
    expect(next).toHaveBeenCalled();
  });

  it('generates correlation id when header is absent', () => {
    const request = {
      header: jest.fn().mockReturnValue(undefined),
    } as unknown as Request;
    const setHeader = jest.fn();
    const response = { setHeader } as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;

    middleware.use(request, response, next);

    expect(setHeader).toHaveBeenCalledWith('X-Correlation-ID', expect.any(String));
    expect(next).toHaveBeenCalled();
  });
});
