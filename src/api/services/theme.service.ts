import { getObjectUrl, uploadTempFile } from '@api/integrations/storage/s3/libs/minio.server';
import { PrismaRepository } from '@api/repository/repository.service';
import { waMonitor } from '@api/server.module';
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
      const result = await this.prisma.storeTheme.upsert({
        where: { userId },
        update: data,
        create: {
          ...data,
          userId,
        },
      });

      // Sync with WhatsApp if enabled
      if (data.syncWhatsapp) {
        await this.syncWithWhatsapp(userId, data);
      }

      return result;
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

  public async getThemeByInstance(instanceName: string) {
    try {
      const instance = await this.prisma.instance.findUnique({
        where: { name: instanceName },
        include: { User: true },
      });

      if (!instance || !instance.User) {
        throw new BadRequestException('Instancia no encontrada');
      }

      const theme = await this.getTheme(instance.User.id);
      const products = await this.prisma.product.findMany({
        where: { instanceId: instance.id },
      });

      return { theme, products };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al obtener la tienda');
    }
  }

  private async syncWithWhatsapp(userId: string, data: StoreThemeDto) {
    try {
      const instance = await this.prisma.instance.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!instance) {
        this.logger.warn('No instance found for user');
        return;
      }

      const waInstance = (waMonitor as any).waInstances?.[instance.name];
      if (!waInstance) {
        this.logger.warn('WhatsApp instance not connected');
        return;
      }

      // Sync profile name
      if (data.storeName) {
        await waInstance.updateProfileName(data.storeName);
      }

      // Sync profile picture
      if (data.logoUrl) {
        await waInstance.updateProfilePicture(data.logoUrl);
      }

      this.logger.info(`Synced theme with WhatsApp for instance: ${instance.name}`);
    } catch (error) {
      this.logger.error(`Error syncing with WhatsApp: ${error.message || error}`);
    }
  }
}
