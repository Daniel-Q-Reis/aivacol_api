import { EntityValidationException } from '../exceptions/entity-validation.exception';

const RENAVAM_LENGTH = 11;
const RENAVAM_WEIGHTS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export class Renavam {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(rawValue: string): Renavam {
    const digitsOnly = rawValue.replace(/\D/g, '');
    const normalizedValue = digitsOnly.padStart(RENAVAM_LENGTH, '0');

    // Legacy RENAVAM values may come with fewer digits; left-pad keeps check-digit validation deterministic.
    if (!/^\d{11}$/.test(normalizedValue)) {
      throw new EntityValidationException({
        entityName: 'Renavam',
        code: 'INVALID_RENAVAM',
        errors: ['Renavam must contain up to 11 numeric digits'],
      });
    }

    if (!Renavam.isChecksumValid(normalizedValue)) {
      throw new EntityValidationException({
        entityName: 'Renavam',
        code: 'INVALID_RENAVAM_CHECK_DIGIT',
        errors: ['Renavam check digit is invalid'],
      });
    }

    return new Renavam(normalizedValue);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Renavam): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private static isChecksumValid(value: string): boolean {
    const baseDigits = value.slice(0, 10).split('').map(Number);
    const checkDigit = Number(value[10]);

    const sum = baseDigits.reduce(
      (accumulator, digit, index) => accumulator + digit * RENAVAM_WEIGHTS[index],
      0,
    );

    const remainder = sum % 11;
    const expectedDigit = remainder === 0 || remainder === 1 ? 0 : 11 - remainder;

    return expectedDigit === checkDigit;
  }
}
