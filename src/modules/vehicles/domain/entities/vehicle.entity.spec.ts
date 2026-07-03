import { EntityValidationException } from '../../../../common/domain/exceptions/entity-validation.exception';
import { Chassis } from '../../../../common/domain/value-objects/chassis.vo';
import { LicensePlate } from '../../../../common/domain/value-objects/license-plate.vo';
import { Renavam } from '../../../../common/domain/value-objects/renavam.vo';
import { Vehicle, VehicleProps } from './vehicle.entity';

function makeProps(overrides: Partial<VehicleProps> = {}): VehicleProps {
  const createdAt = new Date('2026-01-01T10:00:00.000Z');
  const updatedAt = new Date('2026-01-01T10:00:00.000Z');

  return {
    id: '7d4d688d-bf5f-4548-bfd3-a4f1b0290a80',
    licensePlate: LicensePlate.create('ABC1D23'),
    chassis: Chassis.create('9BWZZZ377VT004251'),
    renavam: Renavam.create('00123456789'),
    year: 2026,
    modelId: '08f3a8f6-c6ab-4d85-b1f5-d9de01959eca',
    createdBy: 'e2138574-d04f-4109-ba8f-7f4e2e6cea89',
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe('Vehicle', () => {
  it('creates entity with valid props and exposes primitives', () => {
    const entity = new Vehicle(makeProps());

    expect(entity.toPrimitives()).toMatchObject({
      licensePlate: 'ABC1D23',
      chassis: '9BWZZZ377VT004251',
      renavam: '00123456789',
      year: 2026,
    });
  });

  it('allows next model-year registration as boundary', () => {
    const nextYear = new Date().getFullYear() + 1;
    const entity = new Vehicle(makeProps({ year: nextYear }));

    expect(entity.year).toBe(nextYear);
  });

  it('rejects year below first vehicle production year', () => {
    expect(() => new Vehicle(makeProps({ year: 1885 }))).toThrow(EntityValidationException);
  });

  it('rejects year beyond next-year boundary', () => {
    expect(() => new Vehicle(makeProps({ year: new Date().getFullYear() + 2 }))).toThrow(
      EntityValidationException,
    );
  });

  it('rejects blank required fields', () => {
    expect(() => new Vehicle(makeProps({ id: '  ' }))).toThrow(EntityValidationException);
    expect(() => new Vehicle(makeProps({ modelId: ' ' }))).toThrow(EntityValidationException);
    expect(() => new Vehicle(makeProps({ createdBy: ' ' }))).toThrow(EntityValidationException);
  });

  it('rejects updatedAt earlier than createdAt', () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z');
    const updatedAt = new Date('2026-01-01T09:59:59.000Z');

    expect(() => new Vehicle(makeProps({ createdAt, updatedAt }))).toThrow(
      EntityValidationException,
    );
  });
});
