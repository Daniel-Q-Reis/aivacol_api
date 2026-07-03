import { DomainException } from './domain.exception';

export interface BusinessRuleViolationExceptionParams {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class BusinessRuleViolationException extends DomainException {
  constructor(params: BusinessRuleViolationExceptionParams) {
    super({
      code: params.code,
      message: params.message,
      statusCode: 422,
      details: params.details,
    });
  }
}
