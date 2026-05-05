import { UserService } from '../src/api/services/user.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

function makePrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    plan: {
      findUnique: vi.fn(),
    },
  };
}

describe('UserService', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: UserService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new UserService(prisma as any);
  });

  it('hashes passwords when registering users', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.plan.findUnique.mockResolvedValue({ id: 'plan-free', name: 'Gratis' });
    prisma.user.create.mockResolvedValue({ id: 'user-1' });

    await service.register({
      email: ' USER@example.com ',
      password: 'secure-password',
      name: 'User',
    });

    const createArg = prisma.user.create.mock.calls[0][0];
    expect(createArg.data.email).toBe('user@example.com');
    expect(createArg.data.password).toMatch(/^pbkdf2\$/);
    expect(createArg.data.password).not.toBe('secure-password');
  });

  it('logs in with a hashed password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.plan.findUnique.mockResolvedValue({ id: 'plan-free', name: 'Gratis' });
    prisma.user.create.mockResolvedValue({ id: 'user-1' });

    await service.register({
      email: 'user@example.com',
      password: 'secure-password',
      name: 'User',
    });

    const storedPassword = prisma.user.create.mock.calls[0][0].data.password;
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: storedPassword,
      name: 'User',
      role: 'USER',
      subscription: { plan: { name: 'Gratis' } },
    });

    const response = await service.login({ email: 'user@example.com', password: 'secure-password' });

    expect(response.user.email).toBe('user@example.com');
    expect(response.token).toBeTruthy();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('migrates legacy plain-text passwords after a successful login', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: 'legacy-password',
      name: 'User',
      role: 'USER',
      subscription: { plan: { name: 'Gratis' } },
    });

    await service.login({ email: 'user@example.com', password: 'legacy-password' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: expect.stringMatching(/^pbkdf2\$/) },
    });
  });

  it('rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: 'legacy-password',
      name: 'User',
      role: 'USER',
      subscription: null,
    });

    await expect(service.login({ email: 'user@example.com', password: 'wrong-password' })).rejects.toMatchObject({
      status: 401,
      error: 'Unauthorized',
    });
  });

  it('validates register input before writing to the database', async () => {
    await expect(service.register({ email: 'user@example.com', password: 'short' })).rejects.toMatchObject({
      status: 400,
      error: 'Bad Request',
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
