import { EntityValidationException } from '../../../../common/domain/exceptions/entity-validation.exception';
import { User, UserProps } from './user.entity';

function makeProps(overrides: Partial<UserProps> = {}): UserProps {
  return {
    id: 'ac92c9fd-0863-4ab5-a83d-bcb32f6dc8f2',
    nickname: 'Aivacol',
    name: 'Aivacol Admin',
    email: 'Admin@Aivacol.com',
    passwordHash: '$2b$12$0v8hUsAygH4FCw9B8PxeNOzqFDjstQa6xR8AOAz6N4WQxgQ01x9fW',
    createdBy: 'ac92c9fd-0863-4ab5-a83d-bcb32f6dc8f2',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('User', () => {
  it('normalizes nickname and email to lowercase', () => {
    const user = new User(makeProps({ nickname: '  AIVAcol ', email: ' ADMIN@AIVACOL.COM ' }));

    expect(user.nickname).toBe('aivacol');
    expect(user.email).toBe('admin@aivacol.com');
  });

  it('validates required fields and constraints', () => {
    expect(() => new User(makeProps({ id: ' ' }))).toThrow(EntityValidationException);
    expect(() => new User(makeProps({ nickname: 'ab' }))).toThrow(EntityValidationException);
    expect(() => new User(makeProps({ name: 'a' }))).toThrow(EntityValidationException);
    expect(() => new User(makeProps({ email: 'not-an-email' }))).toThrow(EntityValidationException);
    expect(() => new User(makeProps({ passwordHash: 'short' }))).toThrow(EntityValidationException);
    expect(() => new User(makeProps({ createdBy: ' ' }))).toThrow(EntityValidationException);
  });

  it('rejects updatedAt before createdAt', () => {
    expect(
      () =>
        new User(
          makeProps({
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          }),
        ),
    ).toThrow(EntityValidationException);
  });
});
