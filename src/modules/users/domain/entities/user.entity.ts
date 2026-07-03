import { EntityValidationException } from '../../../../common/domain/exceptions/entity-validation.exception';

const USER_NICKNAME_MIN_LENGTH = 3;
const USER_NAME_MIN_LENGTH = 2;
const USER_NAME_MAX_LENGTH = 120;
const PASSWORD_HASH_MIN_LENGTH = 20;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserProps {
  id: string;
  nickname: string;
  name: string;
  email: string;
  passwordHash: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly props: UserProps;

  constructor(props: UserProps) {
    this.props = {
      ...props,
      nickname: props.nickname.trim().toLowerCase(),
      name: props.name.trim(),
      email: props.email.trim().toLowerCase(),
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };

    this.validate();
  }

  get id(): string {
    return this.props.id;
  }

  get nickname(): string {
    return this.props.nickname;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
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
      errors.push('User id is required');
    }

    if (this.props.nickname.length < USER_NICKNAME_MIN_LENGTH) {
      errors.push(`User nickname must contain at least ${USER_NICKNAME_MIN_LENGTH} characters`);
    }

    if (
      this.props.name.length < USER_NAME_MIN_LENGTH ||
      this.props.name.length > USER_NAME_MAX_LENGTH
    ) {
      errors.push(
        `User name must contain between ${USER_NAME_MIN_LENGTH} and ${USER_NAME_MAX_LENGTH} characters`,
      );
    }

    if (!EMAIL_REGEX.test(this.props.email)) {
      errors.push('User email must be valid');
    }

    if (this.props.passwordHash.trim().length < PASSWORD_HASH_MIN_LENGTH) {
      errors.push('User passwordHash must be a valid hash string');
    }

    if (!this.props.createdBy.trim()) {
      errors.push('User createdBy is required');
    }

    if (this.props.updatedAt.getTime() < this.props.createdAt.getTime()) {
      errors.push('User updatedAt cannot be earlier than createdAt');
    }

    if (errors.length > 0) {
      throw new EntityValidationException({
        entityName: 'User',
        errors,
      });
    }
  }
}
