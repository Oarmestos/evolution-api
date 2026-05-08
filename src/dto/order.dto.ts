export class OrderItemDto {
  productId: string;
  quantity: number;
}

export class OrderDto {
  remoteJid: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  paymentMethod?: string;
  transactionId?: string;
  items: OrderItemDto[];
  status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELED';
}
