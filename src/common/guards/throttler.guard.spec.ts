import { Reflector } from '@nestjs/core';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from './throttler.guard';

describe('ThrottlerGuard', () => {
  it('propagates parent guard decisions', async () => {
    const guard = new ThrottlerGuard(
      [{ ttl: 1000, limit: 1 }],
      { getRecord: jest.fn(), addRecord: jest.fn() } as unknown as ThrottlerStorage,
      { getAllAndOverride: jest.fn() } as unknown as Reflector,
    );
    const context = {} as ExecutionContext;

    const parentPrototype = Object.getPrototypeOf(Object.getPrototypeOf(guard));
    const canActivateSpy = jest.spyOn(parentPrototype, 'canActivate').mockResolvedValue(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(canActivateSpy).toHaveBeenCalledWith(context);
  });
});
