import { DomainException } from './domain.exception';

export interface DuplicateEntityExceptionParams {
  entityName: string;
  field: string;
  value: string;
  code?: string;
}

export class DuplicateEntityException extends DomainException {
  constructor(params: DuplicateEntityExceptionParams) {
    super({
      code: params.code ?? `DUPLICATE_${params.field.toUpperCase()}`,
      message: `${params.entityName} with ${params.field} '${params.value}' already exists`,
      statusCode: 409,
      details: {
        entityName: params.entityName,
        field: params.field,
        value: params.value,
      },
    });
  }
}
