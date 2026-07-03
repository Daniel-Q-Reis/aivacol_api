import { EntityValidationException } from '../exceptions/entity-validation.exception';
import { LicensePlate } from './license-plate.vo';

describe('LicensePlate', () => {
  it('creates a normalized Mercosur plate', () => {
    const plate = LicensePlate.create('abc-1d23');

    expect(plate.getValue()).toBe('ABC1D23');
    expect(plate.toString()).toBe('ABC1D23');
  });

  it('compares equal normalized values', () => {
    const a = LicensePlate.create('abc1d23');
    const b = LicensePlate.create('ABC-1D23');

    expect(a.equals(b)).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(() => LicensePlate.create('AAA1111')).toThrow(EntityValidationException);
  });
});
