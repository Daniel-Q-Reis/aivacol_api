import { DomainException } from './domain.exception';

export interface EntityValidationExceptionParams {
  entityName: string;
  errors: string[];
  code?: string;
}

export class EntityValidationException extends DomainException {
  readonly errors: readonly string[];

  constructor(params: EntityValidationExceptionParams) {
    const normalizedErrors = params.errors.map((error) => error.trim()).filter(Boolean);

    super({
      code: params.code ?? `${params.entityName.toUpperCase()}_VALIDATION_ERROR`,
      message: `${params.entityName} validation failed`,
      statusCode: 400,
      details: {
        entityName: params.entityName,
        errors: normalizedErrors,
      },
    });

    this.errors = normalizedErrors;
  }
}
