import { DomainException } from './domain.exception';

export interface EntityNotFoundExceptionParams {
  entityName: string;
  identifier: string;
  code?: string;
}

export class EntityNotFoundException extends DomainException {
  constructor(params: EntityNotFoundExceptionParams) {
    super({
      code: params.code ?? `${params.entityName.toUpperCase()}_NOT_FOUND`,
      message: `${params.entityName} with identifier '${params.identifier}' was not found`,
      statusCode: 404,
      details: {
        entityName: params.entityName,
        identifier: params.identifier,
      },
    });
  }
}
