import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Events } from '@api/types/wa.types';
import { Auth, ConfigService, HttpServer, Typebot } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { Instance, IntegrationSession, SessionStatus } from '@prisma/client';
import axios from 'axios';

export class TypebotSessionService {
  private readonly logger = new Logger('TypebotSessionService');

  constructor(
    private readonly prismaRepository: PrismaRepository,
    private readonly waMonitor: WAMonitoringService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new TypeBot session with prefilled variables
   */
  public async createNewSession(instance: Instance, data: any) {
    if (data.remoteJid === 'status@broadcast') return;
    const id = Math.floor(Math.random() * 10000000000).toString();

    try {
      const version = this.configService.get<Typebot>('TYPEBOT').API_VERSION;
      let url: string;
      let reqData: {};
      if (version === 'latest') {
        url = `${data.url}/api/v1/typebots/${data.typebot}/startChat`;

        reqData = {
          prefilledVariables: {
            ...data.prefilledVariables,
            remoteJid: data.remoteJid,
            pushName: data.pushName || data.prefilledVariables?.pushName || '',
            instanceName: instance.name,
            serverUrl: this.configService.get<HttpServer>('SERVER').URL,
            apiKey: this.configService.get<Auth>('AUTHENTICATION').API_KEY.KEY,
            ownerJid: instance.number,
          },
        };
      } else {
        url = `${data.url}/api/v1/sendMessage`;

        reqData = {
          startParams: {
            publicId: data.typebot,
            prefilledVariables: {
              ...data.prefilledVariables,
              remoteJid: data.remoteJid,
              pushName: data.pushName || data.prefilledVariables?.pushName || '',
              instanceName: instance.name,
              serverUrl: this.configService.get<HttpServer>('SERVER').URL,
              apiKey: this.configService.get<Auth>('AUTHENTICATION').API_KEY.KEY,
              ownerJid: instance.number,
            },
          },
        };
      }
      const request = await axios.post(url, reqData);

      let session = null;
      if (request?.data?.sessionId) {
        session = await this.prismaRepository.integrationSession.create({
          data: {
            remoteJid: data.remoteJid,
            pushName: data.pushName || '',
            sessionId: `${id}-${request.data.sessionId}`,
            status: 'opened',
            parameters: {
              ...data.prefilledVariables,
              remoteJid: data.remoteJid,
              pushName: data.pushName || '',
              instanceName: instance.name,
              serverUrl: this.configService.get<HttpServer>('SERVER').URL,
              apiKey: this.configService.get<Auth>('AUTHENTICATION').API_KEY.KEY,
              ownerJid: instance.number,
            },
            awaitUser: false,
            botId: data.botId,
            type: 'typebot',
            Instance: {
              connect: {
                id: instance.id,
              },
            },
          },
        });
      }

      const typebotData = {
        remoteJid: data.remoteJid,
        status: 'opened',
        session,
      };
      this.waMonitor.waInstances[instance.name].sendDataWebhook(Events.TYPEBOT_CHANGE_STATUS, typebotData);

      return { ...request.data, session };
    } catch (error) {
      this.logger.error(error);
      return;
    }
  }

  public async handleSessionExpiration(
    instance: Instance,
    session: IntegrationSession,
    expire: number,
    keepOpen: boolean,
    botId: string,
    remoteJid: string,
  ): Promise<boolean> {
    if (session && expire && expire > 0) {
      const now = Date.now();
      const sessionUpdatedAt = new Date(session.updatedAt).getTime();
      const diff = now - sessionUpdatedAt;
      const diffInMinutes = Math.floor(diff / 1000 / 60);

      if (diffInMinutes > expire) {
        if (keepOpen) {
          await this.prismaRepository.integrationSession.update({
            where: { id: session.id },
            data: { status: 'closed' },
          });
        } else {
          await this.prismaRepository.integrationSession.deleteMany({
            where: { botId, remoteJid },
          });
        }
        return true; // Session expired
      }
    }
    return false; // Session still valid
  }

  public async updateSessionStatus(sessionId: string, status: SessionStatus, awaitUser = false) {
    return await this.prismaRepository.integrationSession.update({
      where: { id: sessionId },
      data: { status, awaitUser },
    });
  }

  public async deleteSession(sessionId: string) {
    return await this.prismaRepository.integrationSession.deleteMany({
      where: { id: sessionId },
    });
  }
}
