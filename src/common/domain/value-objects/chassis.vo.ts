import { EntityValidationException } from '../exceptions/entity-validation.exception';

const CHASSIS_LENGTH = 17;
const CHASSIS_ALLOWED_CHARS_REGEX = /^[A-HJ-NPR-Z0-9]+$/;

export class Chassis {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(rawValue: string): Chassis {
    const normalizedValue = rawValue.trim().toUpperCase().replace(/\s+/g, '');

    // VIN/chassis intentionally excludes I, O and Q to avoid ambiguity with 1 and 0.
    if (!CHASSIS_ALLOWED_CHARS_REGEX.test(normalizedValue)) {
      throw new EntityValidationException({
        entityName: 'Chassis',
        code: 'INVALID_CHASSIS',
        errors: ['Chassis must use alphanumeric characters excluding I, O and Q'],
      });
    }

    if (normalizedValue.length !== CHASSIS_LENGTH) {
      throw new EntityValidationException({
        entityName: 'Chassis',
        code: 'INVALID_CHASSIS_LENGTH',
        errors: [`Chassis must contain exactly ${CHASSIS_LENGTH} characters`],
      });
    }

    return new Chassis(normalizedValue);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Chassis): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
