import { EntityValidationException } from '../../../../common/domain/exceptions/entity-validation.exception';
import { Chassis } from '../../../../common/domain/value-objects/chassis.vo';
import { LicensePlate } from '../../../../common/domain/value-objects/license-plate.vo';
import { Renavam } from '../../../../common/domain/value-objects/renavam.vo';

const MIN_VEHICLE_YEAR = 1886;

export interface VehicleProps {
  id: string;
  licensePlate: LicensePlate;
  chassis: Chassis;
  renavam: Renavam;
  year: number;
  modelId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Vehicle {
  private readonly props: VehicleProps;

  constructor(props: VehicleProps) {
    this.props = {
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };

    this.validate();
  }

  get id(): string {
    return this.props.id;
  }

  get licensePlate(): LicensePlate {
    return this.props.licensePlate;
  }

  get chassis(): Chassis {
    return this.props.chassis;
  }

  get renavam(): Renavam {
    return this.props.renavam;
  }

  get year(): number {
    return this.props.year;
  }

  get modelId(): string {
    return this.props.modelId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  validate(): void {
    const errors: string[] = [];
    const currentYear = new Date().getFullYear();

    if (!this.props.id.trim()) {
      errors.push('Vehicle id is required');
    }

    if (!this.props.modelId.trim()) {
      errors.push('Vehicle modelId is required');
    }

    if (!this.props.createdBy.trim()) {
      errors.push('Vehicle createdBy is required');
    }

    // Allowing next-year registration covers model-year rollover used by OEM and dealers.
    if (this.props.year < MIN_VEHICLE_YEAR || this.props.year > currentYear + 1) {
      errors.push(`Vehicle year must be between ${MIN_VEHICLE_YEAR} and ${currentYear + 1}`);
    }

    if (this.props.updatedAt.getTime() < this.props.createdAt.getTime()) {
      errors.push('Vehicle updatedAt cannot be earlier than createdAt');
    }

    if (errors.length > 0) {
      throw new EntityValidationException({
        entityName: 'Vehicle',
        errors,
      });
    }
  }

  toPrimitives(): {
    id: string;
    licensePlate: string;
    chassis: string;
    renavam: string;
    year: number;
    modelId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      licensePlate: this.licensePlate.getValue(),
      chassis: this.chassis.getValue(),
      renavam: this.renavam.getValue(),
      year: this.year,
      modelId: this.modelId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
