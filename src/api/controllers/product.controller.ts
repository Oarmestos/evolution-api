import { ProductService } from '@api/services/product.service';
import { ProductDto } from '@dto/product.dto';

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  public async createProduct(instance: any, data: ProductDto) {
    return this.productService.create(instance.id, data);
  }

  public async getProducts(instance: any) {
    return this.productService.findMany(instance.id);
  }

  public async getProduct(instance: any, id: string) {
    return this.productService.findUnique(instance.id, id);
  }

  public async updateProduct(instance: any, id: string, data: Partial<ProductDto>) {
    return this.productService.update(instance.id, id, data);
  }

  public async deleteProduct(instance: any, id: string) {
    return this.productService.delete(instance.id, id);
  }

  public async uploadProductImage(instance: any, file: Express.Multer.File) {
    return this.productService.uploadProductImage(instance.id, file);
  }
}
