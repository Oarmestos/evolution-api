export class OrderItemDto {
  productId: string;
  quantity: number;
}

export class OrderDto {
  remoteJid: string;
  items: OrderItemDto[];
  status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELED';
}
