import { ThemeService } from '@api/services/theme.service';
import { Request, Response } from 'express';

import { StoreThemeDto } from '../dto/theme.dto';

export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  public async getTheme(req: Request, res: Response) {
    const instanceId = req.query.instanceId as string;
    if (!instanceId) {
      return res.status(400).json({ error: 'ID de instancia requerido' });
    }
    const response = await this.themeService.getTheme(instanceId);
    return res.status(200).json(response);
  }

  public async updateTheme(req: Request, res: Response) {
    const instanceId = req.body.instanceId;
    if (!instanceId) {
      return res.status(400).json({ error: 'ID de instancia requerido' });
    }
    const data: StoreThemeDto = req.body;
    const themeData = { ...data };
    delete (themeData as any).instanceId;
    const response = await this.themeService.updateTheme(instanceId, themeData);
    return res.status(200).json(response);
  }

  public async uploadLogo(req: Request, res: Response) {
    const instanceId = req.body.instanceId || req.query.instanceId;
    if (!instanceId) {
      return res.status(400).json({ error: 'ID de instancia requerido' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const response = await this.themeService.uploadLogo(instanceId, req.file as Express.Multer.File);
    return res.status(200).json(response);
  }

  public async uploadHeroImage(req: Request, res: Response) {
    const instanceId = req.body.instanceId || req.query.instanceId;
    if (!instanceId) {
      return res.status(400).json({ error: 'ID de instancia requerido' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const response = await this.themeService.uploadHeroImage(instanceId, req.file as Express.Multer.File);
    return res.status(200).json(response);
  }

  /**
   * @openapi
   * /store-api/{instanceName}:
   *   get:
   *     summary: Get store data by instance
   *     tags: [Store]
   *     parameters:
   *       - name: instanceName
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: page
   *         in: query
   *         schema:
   *           type: integer
   *           default: 1
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Store data with theme and paginated products
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 theme:
   *                   $ref: '#/components/schemas/StoreTheme'
   *                 products:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Product'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       404:
   *         description: Instance not found
   */
  public async getStoreByInstance(req: Request, res: Response) {
    const instanceName = req.params.instanceName;
    if (!instanceName) {
      return res.status(400).json({ error: 'Nombre de instancia requerido' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    try {
      const data = await this.themeService.getThemeByInstance(instanceName, page, limit);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ error: (error as Error).message });
    }
  }
}
