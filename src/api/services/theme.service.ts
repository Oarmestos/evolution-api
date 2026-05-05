import { getObjectUrl, uploadTempFile } from '@api/integrations/storage/s3/libs/minio.server';
import { PrismaRepository } from '@api/repository/repository.service';
import { waMonitor } from '@api/server.module';
import { Logger } from '@config/logger.config';
import { BadRequestException, NotFoundException } from '@exceptions';
import { v4 as uuidv4 } from 'uuid';

import { StoreThemeDto } from '../dto/theme.dto';

export class ThemeService {
  constructor(private readonly prisma: PrismaRepository) {}
  private readonly logger = new Logger('ThemeService');

  public async getTheme(instanceId: string) {
    try {
      let theme = await this.prisma.storeTheme.findUnique({
        where: { instanceId },
      });

      if (!theme) {
        theme = await this.prisma.storeTheme.create({
          data: { instanceId },
        });
      }

      return theme;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al obtener el tema');
    }
  }

  public async updateTheme(instanceId: string, data: StoreThemeDto) {
    try {
      const result = await this.prisma.storeTheme.upsert({
        where: { instanceId },
        update: data,
        create: {
          ...data,
          instanceId,
        },
      });

      // Sync with WhatsApp if enabled
      if (data.syncWhatsapp) {
        const instance = await this.prisma.instance.findUnique({
          where: { id: instanceId },
        });

        if (instance) {
          await this.syncWithWhatsapp(instance.name, data);
        } else {
          this.logger.warn(`No instance found for id ${instanceId}, skipping WhatsApp sync`);
        }
      }

      return result;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al actualizar el tema');
    }
  }

  public async uploadLogo(instanceId: string, file: Express.Multer.File) {
    try {
      const fileName = `logo-${instanceId}-${uuidv4()}-${file.originalname}`;
      const folder = 'store-logos';

      await uploadTempFile(folder, fileName, file.buffer, file.size, { 'Content-Type': file.mimetype });

      const logoUrl = await getObjectUrl(`${folder}/${fileName}`);

      // Update theme with new logo URL
      await this.prisma.storeTheme.upsert({
        where: { instanceId },
        update: { logoUrl },
        create: { instanceId, logoUrl },
      });

      return { logoUrl };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Error al subir el logo');
    }
  }

  public async getThemeByInstance(instanceName: string, page = 1, limit = 20) {
    try {
      const instance = await this.prisma.instance.findUnique({
        where: { name: instanceName },
      });

      if (!instance) {
        throw new NotFoundException('Instancia no encontrada');
      }

      const theme = await this.getTheme(instance.id);

      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: { instanceId: instance.id, enabled: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.product.count({
          where: { instanceId: instance.id, enabled: true },
        }),
      ]);

      return {
        theme,
        products,
        instanceName: instance.name,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Error al obtener la tienda');
    }
  }

  public async syncWithWhatsapp(instanceName: string, data: StoreThemeDto) {
    try {
      const instance = await this.prisma.instance.findUnique({
        where: { name: instanceName },
      });

      if (!instance) {
        this.logger.warn(`Instance ${instanceName} not found`);
        return;
      }

      const waInstance = (waMonitor as any).waInstances?.[instanceName];
      if (!waInstance) {
        this.logger.warn(`WhatsApp instance ${instanceName} not connected`);
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

      this.logger.info(`Synced theme with WhatsApp for instance: ${instanceName}`);
    } catch (error) {
      this.logger.error(`Error syncing with WhatsApp: ${error.message || error}`);
    }
  }
}
