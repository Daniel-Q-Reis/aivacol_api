import { ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ThrottlerExceptionFilter } from './throttler-exception.filter';

function makeHost(
  request: Record<string, unknown>,
  response: Record<string, unknown>,
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ArgumentsHost;
}

describe('ThrottlerExceptionFilter', () => {
  it('returns standardized RATE_LIMIT_EXCEEDED payload', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const request = {
      originalUrl: '/api/v1/auth/login',
      correlationId: 'cid-rl',
    };

    const filter = new ThrottlerExceptionFilter();
    filter.catch(new ThrottlerException(), makeHost(request, response));

    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        path: '/api/v1/auth/login',
      }),
    );
  });
});
