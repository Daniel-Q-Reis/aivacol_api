import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('returns true when route is marked as public', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;

    const guard = new JwtAuthGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect((reflector.getAllAndOverride as jest.Mock).mock.calls[0][0]).toBe('isPublic');
  });

  it('delegates to passport auth flow when route is not public', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;

    const guard = new JwtAuthGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const superCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockReturnValue(true as never);

    expect(guard.canActivate(context)).toBe(true);
    expect(superCanActivateSpy).toHaveBeenCalledWith(context);
  });
});
