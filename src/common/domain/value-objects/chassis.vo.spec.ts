import { EntityValidationException } from '../exceptions/entity-validation.exception';
import { Chassis } from './chassis.vo';

describe('Chassis', () => {
  it('creates normalized chassis value', () => {
    const chassis = Chassis.create(' 9bwzzz377vt004251 ');

    expect(chassis.getValue()).toBe('9BWZZZ377VT004251');
  });

  it('compares equal values', () => {
    const a = Chassis.create('9BWZZZ377VT004251');
    const b = Chassis.create('9bwzzz377vt004251');

    expect(a.equals(b)).toBe(true);
  });

  it('rejects disallowed characters', () => {
    expect(() => Chassis.create('9BWZZZ377VT00I251')).toThrow(EntityValidationException);
  });

  it('rejects invalid length', () => {
    expect(() => Chassis.create('9BWZZZ377VT00425')).toThrow(EntityValidationException);
  });
});
