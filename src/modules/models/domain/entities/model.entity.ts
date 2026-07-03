import { EntityValidationException } from '../../../../common/domain/exceptions/entity-validation.exception';

const MODEL_NAME_MIN_LENGTH = 2;
const MODEL_NAME_MAX_LENGTH = 120;

export interface ModelProps {
  id: string;
  name: string;
  brandId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Model {
  private readonly props: ModelProps;

  constructor(props: ModelProps) {
    this.props = {
      ...props,
      // Canonical trimming avoids duplicated business names that differ only by leading/trailing spaces.
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

  get brandId(): string {
    return this.props.brandId;
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
      errors.push('Model id is required');
    }

    if (
      this.props.name.length < MODEL_NAME_MIN_LENGTH ||
      this.props.name.length > MODEL_NAME_MAX_LENGTH
    ) {
      errors.push(
        `Model name must contain between ${MODEL_NAME_MIN_LENGTH} and ${MODEL_NAME_MAX_LENGTH} characters`,
      );
    }

    if (!this.props.brandId.trim()) {
      errors.push('Model brandId is required');
    }

    if (!this.props.createdBy.trim()) {
      errors.push('Model createdBy is required');
    }

    if (this.props.updatedAt.getTime() < this.props.createdAt.getTime()) {
      errors.push('Model updatedAt cannot be earlier than createdAt');
    }

    if (errors.length > 0) {
      throw new EntityValidationException({
        entityName: 'Model',
        errors,
      });
    }
  }
}
