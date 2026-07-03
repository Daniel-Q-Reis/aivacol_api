import { EntityValidationException } from '../exceptions/entity-validation.exception';
import { Renavam } from './renavam.vo';

describe('Renavam', () => {
  it('accepts valid 11-digit renavam', () => {
    const renavam = Renavam.create('00123456789');

    expect(renavam.getValue()).toBe('00123456789');
  });

  it('left pads legacy short renavam values', () => {
    const renavam = Renavam.create('123456789');

    expect(renavam.getValue()).toBe('00123456789');
  });

  it('rejects invalid check digit', () => {
    expect(() => Renavam.create('00123456788')).toThrow(EntityValidationException);
  });

  it('rejects too many digits', () => {
    expect(() => Renavam.create('123456789012')).toThrow(EntityValidationException);
  });
});
