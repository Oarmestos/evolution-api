import { OrderService } from '../src/api/services/order.service';
import { describe, expect, it, vi } from 'vitest';

function makePrismaMock() {
  return {
    product: {
      findFirst: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe('OrderService', () => {
  it('loads products scoped to the current instance when creating orders', async () => {
    const prisma = makePrismaMock();
    prisma.product.findFirst.mockResolvedValue({ id: 'product-1', price: 10 });
    prisma.order.create.mockResolvedValue({ id: 'order-1' });

    const service = new OrderService(prisma as any);

    await service.create('instance-1', {
      remoteJid: '5511999999999@s.whatsapp.net',
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: { id: 'product-1', instanceId: 'instance-1' },
    });
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          instanceId: 'instance-1',
          total: 20,
        }),
      }),
    );
  });

  it('rejects invalid order statuses before writing', async () => {
    const prisma = makePrismaMock();
    const service = new OrderService(prisma as any);

    await expect(service.updateStatus('instance-1', 'order-1', 'REFUNDED')).rejects.toMatchObject({
      status: 400,
      error: 'Bad Request',
    });

    expect(prisma.order.findFirst).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('updates order status only after finding it in the current instance', async () => {
    const prisma = makePrismaMock();
    prisma.order.findFirst.mockResolvedValue({ id: 'order-1', instanceId: 'instance-1' });
    prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'PAID' });

    const service = new OrderService(prisma as any);

    await service.updateStatus('instance-1', 'order-1', 'PAID');

    expect(prisma.order.findFirst).toHaveBeenCalledWith({
      where: { id: 'order-1', instanceId: 'instance-1' },
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'PAID' },
    });
  });
});
