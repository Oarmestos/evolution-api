import { PrismaRepository } from '@api/repository/repository.service';
import { Logger } from '@config/logger.config';
import { BadRequestException, NotFoundException } from '@exceptions';
import { InstanceDto } from 'src/dto/instance.dto';

export class WAMonitoringService {
  constructor(private readonly prisma: PrismaRepository) {}

  private readonly logger = new Logger('WAMonitoringService');
  public waInstances: Record<string, any> = {};

  public async loadInstance() {
    try {
      const instances = await this.prisma.instance.findMany({
        where: { connectionStatus: 'open' },
      });

      for (const instance of instances) {
        // Initialize instance logic...
        this.waInstances[instance.name] = { /* mock instance object */ };
      }
      this.logger.info(`Loaded ${instances.length} active instances`);
    } catch (error) {
      this.logger.error('Error loading instances:', error);
    }
  }

  public async saveInstance(instanceData: InstanceDto) {
    try {
      // CRITICAL: Validate userId exists in Prisma to avoid P2003 Foreign Key constraint error
      if (instanceData.userId) {
        const userExists = await this.prisma.user.findUnique({
          where: { id: instanceData.userId },
        });

        if (!userExists) {
          this.logger.warn(`User with ID ${instanceData.userId} not found. Setting userId to null to preserve referential integrity.`);
          instanceData.userId = null;
        }
      }

      const result = await this.prisma.instance.upsert({
        where: { name: instanceData.instanceName },
        update: {
          connectionStatus: instanceData.connectionStatus as any,
          ownerJid: instanceData.ownerJid,
          profilePicUrl: instanceData.profilePicUrl,
          number: instanceData.number,
          userId: instanceData.userId,
        },
        create: {
          name: instanceData.instanceName,
          connectionStatus: instanceData.connectionStatus as any,
          ownerJid: instanceData.ownerJid,
          profilePicUrl: instanceData.profilePicUrl,
          number: instanceData.number,
          userId: instanceData.userId,
        },
      });
      return result;
    } catch (error) {
      this.logger.error('Error saving instance to database:', error);
      throw error;
    }
  }
}
