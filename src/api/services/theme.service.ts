import { getObjectUrl, uploadTempFile } from '@api/integrations/storage/s3/libs/minio.server';
import { PrismaRepository } from '@api/repository/repository.service';
import { Logger } from '@config/logger.config';
import { BadRequestException } from '@exceptions';
import { v4 as uuidv4 } from 'uuid';

import { StoreThemeDto } from '../dto/theme.dto';

export class ThemeService {
  constructor(private readonly prisma: PrismaRepository) {}
  private readonly logger = new Logger('ThemeService');

  public async getTheme(userId: string) {
    try {
      let theme = await this.prisma.storeTheme.findUnique({
        where: { userId },
      });

      if (!theme) {
        theme = await this.prisma.storeTheme.create({
          data: { userId },
        });
      }

      return theme;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al obtener el tema');
    }
  }

  public async updateTheme(userId: string, data: StoreThemeDto) {
    try {
      return await this.prisma.storeTheme.upsert({
        where: { userId },
        update: data,
        create: {
          ...data,
          userId,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al actualizar el tema');
    }
  }

  public async uploadLogo(userId: string, file: Express.Multer.File) {
    try {
      const fileName = `logo-${userId}-${uuidv4()}-${file.originalname}`;
      const folder = 'store-logos';

      await uploadTempFile(folder, fileName, file.buffer, file.size, { 'Content-Type': file.mimetype });

      const logoUrl = await getObjectUrl(`${folder}/${fileName}`);

      // Update theme with new logo URL
      await this.prisma.storeTheme.upsert({
        where: { userId },
        update: { logoUrl },
        create: { userId, logoUrl },
      });

      return { logoUrl };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al subir el logo');
    }
  }
}
