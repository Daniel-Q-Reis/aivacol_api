import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DomainException } from '../domain/exceptions/domain.exception';
import { EntityNotFoundException } from '../domain/exceptions/entity-not-found.exception';
import { ERROR_CATALOG } from '../errors/error-catalog';
import { GlobalExceptionFilter } from './global-exception.filter';

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

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let response: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('maps DomainException to cataloged status and code', () => {
    const exception = new EntityNotFoundException({
      entityName: 'Vehicle',
      identifier: 'id-1',
      code: ERROR_CATALOG.VEHICLE_NOT_FOUND.code,
    });

    filter.catch(
      exception,
      makeHost({ url: '/api/v1/vehicles/id-1', correlationId: 'cid-1' }, response),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: ERROR_CATALOG.VEHICLE_NOT_FOUND.code }),
    );
  });

  it('maps HttpException and normalizes framework messages to PT-BR catalog', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(
      exception,
      makeHost({ url: '/api/v1/vehicles', correlationId: 'cid-2' }, response),
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ERROR_CATALOG.UNAUTHORIZED.code,
        message: ERROR_CATALOG.UNAUTHORIZED.message,
      }),
    );
  });

  it('maps unexpected errors to INTERNAL_SERVER_ERROR', () => {
    filter.catch(
      new Error('boom'),
      makeHost({ url: '/api/v1/vehicles', correlationId: 'cid-3' }, response),
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: ERROR_CATALOG.INTERNAL_SERVER_ERROR.code }),
    );
  });

  it('maps DomainException with unknown code to original payload', () => {
    class CustomDomainException extends DomainException {
      constructor() {
        super({
          code: 'CUSTOM_UNKNOWN_CODE',
          message: 'Custom domain issue',
          statusCode: 422,
        });
      }
    }

    filter.catch(
      new CustomDomainException(),
      makeHost({ url: '/api/v1/custom', correlationId: 'cid-4' }, response),
    );

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CUSTOM_UNKNOWN_CODE',
        message: 'Custom domain issue',
      }),
    );
  });

  it('maps HttpException object response with explicit code', () => {
    const exception = new HttpException(
      { message: ['first error', 'second error'], code: 'CUSTOM_HTTP_CODE' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, makeHost({ url: '/api/v1/test', correlationId: 'cid-5' }, response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'first error',
        code: 'CUSTOM_HTTP_CODE',
      }),
    );
  });

  it('maps HttpException object response to default message when message is invalid', () => {
    const exception = new HttpException({ message: 123 }, HttpStatus.FORBIDDEN);

    filter.catch(exception, makeHost({ url: '/api/v1/test', correlationId: 'cid-6' }, response));

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ERROR_CATALOG.FORBIDDEN.code,
        message: ERROR_CATALOG.FORBIDDEN.message,
      }),
    );
  });

  it('uses generic bad request message when status has no mapped code', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, makeHost({ url: '/api/v1/test', correlationId: 'cid-7' }, response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Bad Request',
      }),
    );
  });

  it('handles unknown non-error exception logging branch', () => {
    const loggerSpy = jest
      .spyOn((filter as any).logger, 'error')
      .mockImplementation(() => undefined);

    filter.catch(
      'primitive boom',
      makeHost({ url: '/api/v1/test', correlationId: 'cid-8' }, response),
    );

    expect(loggerSpy).toHaveBeenCalledWith('Unknown exception captured by global filter');
    expect(response.status).toHaveBeenCalledWith(500);
  });
});
