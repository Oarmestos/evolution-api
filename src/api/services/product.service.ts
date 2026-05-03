import { PrismaRepository } from '@api/repository/repository.service';
import { Logger } from '@config/logger.config';
import { ProductDto } from '@dto/product.dto';
import { NotFoundException } from '@exceptions';

export class ProductService {
  constructor(private readonly prisma: PrismaRepository) {}
  private readonly logger = new Logger('ProductService');

  public async create(instanceId: string, data: ProductDto) {
    return this.prisma.product.create({
      data: {
        ...data,
        instanceId,
      },
    });
  }

  public async findMany(instanceId: string) {
    return this.prisma.product.findMany({
      where: { instanceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findUnique(instanceId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, instanceId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  public async update(instanceId: string, id: string, data: Partial<ProductDto>) {
    await this.findUnique(instanceId, id);
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  public async delete(instanceId: string, id: string) {
    await this.findUnique(instanceId, id);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
