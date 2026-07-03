import { ExecutionContext } from '@nestjs/common';
import { getCurrentUserFromContext } from './current-user.decorator';

describe('getCurrentUserFromContext', () => {
  const createContext = (user?: Record<string, unknown>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('returns full user when field is not provided', () => {
    const requestUser = {
      sub: '7f58f2a7-9c3f-4f1f-9b1f-c7af9f8ad111',
      email: 'seed@aivacol.local',
      role: 'admin',
    };

    const result = getCurrentUserFromContext(undefined, createContext(requestUser));

    expect(result).toEqual(requestUser);
  });

  it('returns specific field when provided', () => {
    const requestUser = {
      sub: 'b0ad2ef6-4f7a-4f0e-bbf9-8f0ab35d2f28',
      email: 'seed@aivacol.local',
      role: 'admin',
    };

    const result = getCurrentUserFromContext('email', createContext(requestUser));

    expect(result).toBe('seed@aivacol.local');
  });

  it('returns empty object when request has no user', () => {
    const result = getCurrentUserFromContext(undefined, createContext());

    expect(result).toEqual({});
  });
});
