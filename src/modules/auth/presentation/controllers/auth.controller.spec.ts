import { AuthController } from './auth.controller';
import { AuthService } from '../../application/services/auth.service';

describe('AuthController', () => {
  it('delegates login to auth service and returns token contract', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({ access_token: 'jwt-token' }),
    } as unknown as AuthService;

    const controller = new AuthController(authService);
    const response = await controller.login({ nickname: 'aivacol', password: 'secret' });

    expect(response).toEqual({ access_token: 'jwt-token' });
    expect(authService.login as jest.Mock).toHaveBeenCalledWith({
      nickname: 'aivacol',
      password: 'secret',
    });
  });
});
