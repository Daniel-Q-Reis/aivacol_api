import { EntityValidationException } from '../../../../common/domain/exceptions/entity-validation.exception';
import { Brand, BrandProps } from './brand.entity';

function makeProps(overrides: Partial<BrandProps> = {}): BrandProps {
  const createdAt = new Date('2026-01-01T10:00:00.000Z');
  const updatedAt = new Date('2026-01-01T10:00:00.000Z');

  return {
    id: '3f7ef9d3-f86e-40ef-82b6-c2ef3c1c6fc6',
    name: 'Toyota',
    createdBy: '28dfa919-cf78-4ea2-8128-dd2e0bbecf94',
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe('Brand', () => {
  it('trims name and keeps canonical display value', () => {
    const brand = new Brand(makeProps({ name: '  Volkswagen  ' }));

    expect(brand.name).toBe('Volkswagen');
  });

  it('rejects name outside business boundaries', () => {
    expect(() => new Brand(makeProps({ name: 'A' }))).toThrow(EntityValidationException);
    expect(() => new Brand(makeProps({ name: 'A'.repeat(121) }))).toThrow(
      EntityValidationException,
    );
  });

  it('rejects blank required fields', () => {
    expect(() => new Brand(makeProps({ id: ' ' }))).toThrow(EntityValidationException);
    expect(() => new Brand(makeProps({ createdBy: ' ' }))).toThrow(EntityValidationException);
  });

  it('rejects updatedAt earlier than createdAt', () => {
    expect(
      () =>
        new Brand(
          makeProps({
            createdAt: new Date('2026-01-02T10:00:00.000Z'),
            updatedAt: new Date('2026-01-01T10:00:00.000Z'),
          }),
        ),
    ).toThrow(EntityValidationException);
  });
});
