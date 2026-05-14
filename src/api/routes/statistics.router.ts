import { RouterBroker } from '@api/abstract/abstract.router';
import { InstanceDto } from '@api/dto/instance.dto';
import { statisticsController } from '@api/server.module';
import { RequestHandler, Router } from 'express';

import { HttpStatus } from './index.router';

export class StatisticsRouter extends RouterBroker {
  public readonly router: Router = Router();

  constructor(...guards: RequestHandler[]) {
    super();

    this.router.get(this.routerPath('summary'), ...guards, async (req, res) => {
      const response = await this.dataValidate<any>({
        request: req,
        schema: {},
        ClassRef: InstanceDto,
        execute: (instance) => statisticsController.getSummary(instance),
      });
      return res.status(HttpStatus.OK).json(response);
    });
  }
}
