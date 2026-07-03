import { EntityValidationException } from '../exceptions/entity-validation.exception';

const LICENSE_PLATE_MERCOSUL_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export class LicensePlate {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(rawValue: string): LicensePlate {
    const normalizedValue = rawValue
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    if (!LICENSE_PLATE_MERCOSUL_REGEX.test(normalizedValue)) {
      throw new EntityValidationException({
        entityName: 'LicensePlate',
        code: 'INVALID_LICENSE_PLATE',
        errors: ['License plate must match Mercosul format (AAA0A00)'],
      });
    }

    return new LicensePlate(normalizedValue);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: LicensePlate): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
