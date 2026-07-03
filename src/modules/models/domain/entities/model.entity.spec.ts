import { EntityValidationException } from '../../../../common/domain/exceptions/entity-validation.exception';
import { Model, ModelProps } from './model.entity';

function makeProps(overrides: Partial<ModelProps> = {}): ModelProps {
  const createdAt = new Date('2026-01-01T10:00:00.000Z');
  const updatedAt = new Date('2026-01-01T10:00:00.000Z');

  return {
    id: 'eff5efe9-036d-46c2-9790-5d316ebfa473',
    name: 'Corolla',
    brandId: '8366e7db-f6c8-4460-b9d3-a422e73b91dc',
    createdBy: '6dcf9635-7e34-48c8-bf08-5f89e6fa3d37',
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe('Model', () => {
  it('trims name on construction', () => {
    const model = new Model(makeProps({ name: '  Corolla Cross  ' }));

    expect(model.name).toBe('Corolla Cross');
  });

  it('rejects invalid name length boundaries', () => {
    expect(() => new Model(makeProps({ name: 'A' }))).toThrow(EntityValidationException);
    expect(() => new Model(makeProps({ name: 'A'.repeat(121) }))).toThrow(
      EntityValidationException,
    );
  });

  it('rejects missing identifiers and creator', () => {
    expect(() => new Model(makeProps({ id: ' ' }))).toThrow(EntityValidationException);
    expect(() => new Model(makeProps({ brandId: ' ' }))).toThrow(EntityValidationException);
    expect(() => new Model(makeProps({ createdBy: ' ' }))).toThrow(EntityValidationException);
  });

  it('rejects updatedAt before createdAt', () => {
    expect(
      () =>
        new Model(
          makeProps({
            createdAt: new Date('2026-01-01T10:00:00.000Z'),
            updatedAt: new Date('2025-12-31T10:00:00.000Z'),
          }),
        ),
    ).toThrow(EntityValidationException);
  });
});
