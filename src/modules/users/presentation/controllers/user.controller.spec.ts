import { UserController } from './user.controller';
import { UserService } from '../../application/services/user.service';

describe('UserController', () => {
  let service: jest.Mocked<UserService>;
  let controller: UserController;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserService>;
    controller = new UserController(service);
  });

  it('delegates list and findById with audit context fields', async () => {
    service.findAll.mockResolvedValue([{ id: 'u1' } as any]);
    service.findById.mockResolvedValue({ id: 'u1' } as any);

    await controller.findAll('user-1', 'cid-1');
    await controller.findById('u1', 'user-1', 'cid-1');

    expect(service.findAll).toHaveBeenCalledWith({ userId: 'user-1', correlationId: 'cid-1' });
    expect(service.findById).toHaveBeenCalledWith('u1', {
      userId: 'user-1',
      correlationId: 'cid-1',
    });
  });
});
