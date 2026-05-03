import { RouterBroker } from '@api/abstract/abstract.router';
import { InstanceDto } from '@api/dto/instance.dto';
import { orderController } from '@api/server.module';
import { OrderDto } from '@dto/order.dto';
import { orderSchema } from '@validate/order.validate';
import { RequestHandler, Router } from 'express';

import { HttpStatus } from './index.router';

export class OrderRouter extends RouterBroker {
  public readonly router: Router = Router();

  constructor(...guards: RequestHandler[]) {
    super();

    this.router
      .post(this.routerPath(''), ...guards, async (req, res) => {
        const response = await this.dataValidate<OrderDto>({
          request: req,
          schema: orderSchema,
          ClassRef: InstanceDto,
          execute: (instance, data) => orderController.createOrder(instance, data),
        });
        return res.status(HttpStatus.CREATED).json(response);
      })
      .get(this.routerPath(''), ...guards, async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: {},
          ClassRef: InstanceDto,
          execute: (instance) => orderController.getOrders(instance),
        });
        return res.status(HttpStatus.OK).json(response);
      })
      .patch(this.routerPath('status/:id'), ...guards, async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: {
            type: 'object',
            properties: { status: { type: 'string' } },
            required: ['status'],
          },
          ClassRef: InstanceDto,
          execute: (instance, data) => orderController.updateOrderStatus(instance, req.params.id, data.status),
        });
        return res.status(HttpStatus.OK).json(response);
      });
  }
}
