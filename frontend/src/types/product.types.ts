export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  sku?: string;
  category?: string;
  enabled: boolean;
  createdAt?: string;
}

export type StockFilter = 'all' | 'instock' | 'outofstock' | 'lowstock';

export function isStockFilter(value: string): value is StockFilter {
  return ['all', 'instock', 'outofstock', 'lowstock'].includes(value);
}
