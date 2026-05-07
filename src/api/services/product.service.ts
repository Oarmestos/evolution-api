import { getObjectUrl, uploadTempFile } from '@api/integrations/storage/s3/libs/minio.server';
import { PrismaRepository } from '@api/repository/repository.service';
import { Logger } from '@config/logger.config';
import { ProductDto } from '@dto/product.dto';
import { BadRequestException, NotFoundException } from '@exceptions';
import { v4 as uuidv4 } from 'uuid';

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

  public async uploadProductImage(instanceId: string, file: Express.Multer.File) {
    try {
      const fileName = `product-${instanceId}-${uuidv4()}-${file.originalname}`;
      const folder = 'product-images';

      await uploadTempFile(folder, fileName, file.buffer, file.size, { 'Content-Type': file.mimetype });

      const imageUrl = await getObjectUrl(`${folder}/${fileName}`);

      return { imageUrl };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al subir la imagen del producto');
    }
  }
}
