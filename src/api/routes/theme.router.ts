import { RouterBroker } from '@api/abstract/abstract.router';
import { themeController } from '@api/server.module';
import { RequestHandler, Router } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export class ThemeRouter extends RouterBroker {
  public readonly router: Router = Router();

  constructor(...guards: RequestHandler[]) {
    super();

    this.router
      .get(this.routerPath('fetch', false), ...guards, async (req, res) => {
        return themeController.getTheme(req, res);
      })
      .put(this.routerPath('update', false), ...guards, async (req, res) => {
        return themeController.updateTheme(req, res);
      })
      .post(this.routerPath('logo', false), ...guards, upload.single('file'), async (req, res) => {
        return themeController.uploadLogo(req, res);
      })
      .get('/store/:instanceName', async (req, res) => {
        return themeController.getStoreByInstance(req, res);
      })
      .get('/store-api/:instanceName', async (req, res) => {
        return themeController.getStoreByInstance(req, res);
      });
  }
}
