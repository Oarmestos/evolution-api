import { ThemeService } from '@api/services/theme.service';
import { Request, Response } from 'express';

import { StoreThemeDto } from '../dto/theme.dto';

export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  public async getTheme(req: Request, res: Response) {
    const userId = req['user']?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const response = await this.themeService.getTheme(userId);
    return res.status(200).json(response);
  }

  public async updateTheme(req: Request, res: Response) {
    const userId = req['user']?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const data: StoreThemeDto = req.body;
    const response = await this.themeService.updateTheme(userId, data);
    return res.status(200).json(response);
  }

  public async uploadLogo(req: Request, res: Response) {
    const userId = req['user']?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const response = await this.themeService.uploadLogo(userId, req.file as Express.Multer.File);
    return res.status(200).json(response);
  }
}
