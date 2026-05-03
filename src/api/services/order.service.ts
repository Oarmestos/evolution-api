import { PrismaRepository } from '@api/repository/repository.service';
import { Logger } from '@config/logger.config';
import { OrderDto } from '@dto/order.dto';
import { NotFoundException } from '@exceptions';

export class OrderService {
  constructor(private readonly prisma: PrismaRepository) {}
  private readonly logger = new Logger('OrderService');

  public async create(instanceId: string, data: OrderDto) {
    let total = 0;
    const itemsData = [];

    for (const item of data.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, instanceId },
      });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      total += product.price * item.quantity;
      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: product.price,
      });
    }

    return this.prisma.order.create({
      data: {
        instanceId,
        remoteJid: data.remoteJid,
        total,
        status: data.status || 'PENDING',
        items: {
          create: itemsData,
        },
      },
      include: {
        items: {
          include: {
            Product: true,
          },
        },
      },
    });
  }

  public async findMany(instanceId: string) {
    return this.prisma.order.findMany({
      where: { instanceId },
      include: {
        items: {
          include: {
            Product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async updateStatus(instanceId: string, id: string, status: any) {
    const order = await this.prisma.order.findFirst({
      where: { id, instanceId },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
