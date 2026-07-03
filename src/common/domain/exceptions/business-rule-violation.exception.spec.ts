import { BusinessRuleViolationException } from './business-rule-violation.exception';

describe('BusinessRuleViolationException', () => {
  it('creates 422 exception with optional details', () => {
    const details = { field: 'plate' };
    const exception = new BusinessRuleViolationException({
      code: 'RULE_VIOLATION',
      message: 'Regra inválida',
      details,
    });

    expect(exception.code).toBe('RULE_VIOLATION');
    expect(exception.message).toBe('Regra inválida');
    expect(exception.statusCode).toBe(422);
    expect(exception.details).toEqual(details);
  });
});
