export class ProductDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock: number;
  sku?: string;
  category?: string;
  enabled: boolean;
}
