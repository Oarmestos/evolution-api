import { OrderService } from '@api/services/order.service';
import { OrderDto } from '@dto/order.dto';

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  public async createOrder(instance: any, data: OrderDto) {
    return this.orderService.create(instance.id, data);
  }

  public async getOrders(instance: any) {
    return this.orderService.findMany(instance.id);
  }

  public async updateOrderStatus(instance: any, id: string, status: string) {
    return this.orderService.updateStatus(instance.id, id, status);
  }
}
