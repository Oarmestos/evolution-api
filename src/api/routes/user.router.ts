import { RouterBroker } from '@api/abstract/abstract.router';
import { userController } from '@api/server.module';
import { Router } from 'express';

export class UserRouter extends RouterBroker {
  constructor() {
    super();
    this.router
      .post('/register', async (req, res) => {
        const response = await this.userController.register(req, res);
        return response;
      })
      .post('/login', async (req, res) => {
        const response = await this.userController.login(req, res);
        return response;
      });
  }

  private readonly userController = userController;
  public readonly router: Router = Router();
}
