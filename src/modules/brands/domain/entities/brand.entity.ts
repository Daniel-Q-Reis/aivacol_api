import { EntityValidationException } from '../../../../common/domain/exceptions/entity-validation.exception';

const BRAND_NAME_MIN_LENGTH = 2;
const BRAND_NAME_MAX_LENGTH = 120;

export interface BrandProps {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Brand {
  private readonly props: BrandProps;

  constructor(props: BrandProps) {
    this.props = {
      ...props,
      // Keep a stable representation for uniqueness checks and human-readable listings.
      name: props.name.trim(),
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };

    this.validate();
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
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

    if (!this.props.id.trim()) {
      errors.push('Brand id is required');
    }

    if (
      this.props.name.length < BRAND_NAME_MIN_LENGTH ||
      this.props.name.length > BRAND_NAME_MAX_LENGTH
    ) {
      errors.push(
        `Brand name must contain between ${BRAND_NAME_MIN_LENGTH} and ${BRAND_NAME_MAX_LENGTH} characters`,
      );
    }

    if (!this.props.createdBy.trim()) {
      errors.push('Brand createdBy is required');
    }

    if (this.props.updatedAt.getTime() < this.props.createdAt.getTime()) {
      errors.push('Brand updatedAt cannot be earlier than createdAt');
    }

    if (errors.length > 0) {
      throw new EntityValidationException({
        entityName: 'Brand',
        errors,
      });
    }
  }
}
