import { PrismaRepository } from '@api/repository/repository.service';
import { CacheService } from '@api/services/cache.service';
import { Events } from '@api/types/wa.types';
import {
  CacheConf,
  Chatwoot,
  ConfigService,
  ConfigSessionPhone,
  Database,
  ProviderSession,
  QrCode,
} from '@config/env.config';
import { InternalServerErrorException } from '@exceptions';
import { Boom } from '@hapi/boom';
import { fetchLatestWaWebVersion } from '@utils/fetchLatestWaWebVersion';
import { makeProxyAgent, makeProxyAgentUndici } from '@utils/makeProxyAgent';
import useMultiFileAuthStatePrisma from '@utils/use-multi-file-auth-state-prisma';
import { useMultiFileAuthStateRedisDb } from '@utils/use-multi-file-auth-state-redis-db';
import axios from 'axios';
import makeWASocket, {
  ConnectionState,
  delay,
  DisconnectReason,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  makeCacheableSignalKeyStore,
  proto,
  UserFacingSocketConfig,
  WABrowserDescription,
  WASocket,
} from 'baileys';
import { release } from 'os';
import P from 'pino';
import qrcode, { QRCodeToDataURLOptions } from 'qrcode';

import { useVoiceCallsBaileys } from '../voiceCalls/useVoiceCallsBaileys';

export class BaileysConnectionService {
  constructor(
    private readonly prismaRepository: PrismaRepository,
    private readonly configService: ConfigService,
    private readonly cache: CacheService,
  ) {}

  public async defineAuthState(service: any) {
    const db = this.configService.get<Database>('DATABASE');
    const cache = this.configService.get<CacheConf>('CACHE');
    const provider = this.configService.get<ProviderSession>('PROVIDER');

    if (provider?.ENABLED) {
      return await service.authStateProvider.authStateProvider(service.instance.id);
    }

    if (cache?.REDIS.ENABLED && cache?.REDIS.SAVE_INSTANCES) {
      service.logger.info('Redis enabled');
      return await useMultiFileAuthStateRedisDb(service.instance.id, this.cache);
    }

    if (db.SAVE_DATA.INSTANCE) {
      return await useMultiFileAuthStatePrisma(service.instance.id, this.cache);
    }
  }

  public async connectionUpdate(service: any, { qr, connection, lastDisconnect }: Partial<ConnectionState>) {
    if (qr) {
      if (service.instance.qrcode.count === this.configService.get<QrCode>('QRCODE').LIMIT) {
        service.sendDataWebhook(Events.QRCODE_UPDATED, {
          message: 'QR code limit reached, please login again',
          statusCode: DisconnectReason.badSession,
        });

        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && service.localChatwoot?.enabled) {
          service.chatwootService.eventWhatsapp(
            Events.QRCODE_UPDATED,
            { instanceName: service.instance.name, instanceId: service.instanceId },
            { message: 'QR code limit reached, please login again', statusCode: DisconnectReason.badSession },
          );
        }

        service.sendDataWebhook(Events.CONNECTION_UPDATE, {
          instance: service.instance.name,
          state: 'refused',
          statusReason: DisconnectReason.connectionClosed,
          wuid: service.instance.wuid,
          profileName: await service.getProfileName(),
          profilePictureUrl: service.instance.profilePictureUrl,
        });

        service.endSession = true;

        return service.eventEmitter.emit('no.connection', service.instance.name);
      }

      service.instance.qrcode.count++;

      const color = this.configService.get<QrCode>('QRCODE').COLOR;

      const optsQrcode: QRCodeToDataURLOptions = {
        margin: 3,
        scale: 4,
        errorCorrectionLevel: 'H',
        color: { light: '#ffffff', dark: color },
      };

      if (service.phoneNumber) {
        await delay(1000);
        service.instance.qrcode.pairingCode = await service.client.requestPairingCode(service.phoneNumber);
      } else {
        service.instance.qrcode.pairingCode = null;
      }

      qrcode.toDataURL(qr, optsQrcode, (error, base64) => {
        if (error) {
          service.logger.error('Qrcode generate failed:' + error.toString());
          return;
        }

        service.instance.qrcode.base64 = base64;
        service.instance.qrcode.code = qr;

        service.sendDataWebhook(Events.QRCODE_UPDATED, {
          qrcode: {
            instance: service.instance.name,
            pairingCode: service.instance.qrcode.pairingCode,
            code: qr,
            base64,
          },
        });

        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && service.localChatwoot?.enabled) {
          service.chatwootService.eventWhatsapp(
            Events.QRCODE_UPDATED,
            { instanceName: service.instance.name, instanceId: service.instanceId },
            {
              qrcode: {
                instance: service.instance.name,
                pairingCode: service.instance.qrcode.pairingCode,
                code: qr,
                base64,
              },
            },
          );
        }
      });

      await this.prismaRepository.instance.update({
        where: { id: service.instanceId },
        data: { connectionStatus: 'connecting' },
      });
    }

    if (connection) {
      service.stateConnection = {
        state: connection,
        statusReason: (lastDisconnect?.error as Boom)?.output?.statusCode ?? 200,
      };
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const codesToNotReconnect = [DisconnectReason.loggedOut, DisconnectReason.forbidden, 402, 406];
      const shouldReconnect = !codesToNotReconnect.includes(statusCode);
      if (shouldReconnect) {
        await service.connectToWhatsapp(service.phoneNumber);
      } else {
        service.sendDataWebhook(Events.STATUS_INSTANCE, {
          instance: service.instance.name,
          status: 'closed',
          disconnectionAt: new Date(),
          disconnectionReasonCode: statusCode,
          disconnectionObject: JSON.stringify(lastDisconnect),
        });

        await this.prismaRepository.instance.update({
          where: { id: service.instanceId },
          data: {
            connectionStatus: 'close',
            disconnectionAt: new Date(),
            disconnectionReasonCode: statusCode,
            disconnectionObject: JSON.stringify(lastDisconnect),
          },
        });

        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && service.localChatwoot?.enabled) {
          service.chatwootService.eventWhatsapp(
            Events.STATUS_INSTANCE,
            { instanceName: service.instance.name, instanceId: service.instanceId },
            { instance: service.instance.name, status: 'closed' },
          );
        }

        service.eventEmitter.emit('logout.instance', service.instance.name, 'inner');
        service.client?.ws?.close();
        service.client.end(new Error('Close connection'));

        service.sendDataWebhook(Events.CONNECTION_UPDATE, {
          instance: service.instance.name,
          ...service.stateConnection,
        });
      }
    }

    if (connection === 'open') {
      service.instance.wuid = service.client.user.id.replace(/:\d+/, '');
      try {
        const profilePic = await service.profilePicture(service.instance.wuid);
        service.instance.profilePictureUrl = profilePic.profilePictureUrl;
      } catch {
        service.instance.profilePictureUrl = null;
      }
      const formattedWuid = service.instance.wuid.split('@')[0].padEnd(30, ' ');
      const formattedName = service.instance.name;
      service.logger.info(
        `
        \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
        \u2502    CONNECTED TO WHATSAPP     \u2502
        \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518`.replace(
          /^ +/gm,
          '  ',
        ),
      );
      service.logger.info(
        `
        wuid: ${formattedWuid}
        name: ${formattedName}
      `,
      );

      await this.prismaRepository.instance.update({
        where: { id: service.instanceId },
        data: {
          ownerJid: service.instance.wuid,
          number: service.instance.wuid?.split('@')?.[0] || null,
          profileName: (await service.getProfileName()) as string,
          profilePicUrl: service.instance.profilePictureUrl,
          connectionStatus: 'open',
        },
      });

      if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && service.localChatwoot?.enabled) {
        service.chatwootService.eventWhatsapp(
          Events.CONNECTION_UPDATE,
          { instanceName: service.instance.name, instanceId: service.instanceId },
          { instance: service.instance.name, status: 'open' },
        );
        service.syncChatwootLostMessages();
      }

      service.sendDataWebhook(Events.CONNECTION_UPDATE, {
        instance: service.instance.name,
        wuid: service.instance.wuid,
        profileName: await service.getProfileName(),
        profilePictureUrl: service.instance.profilePictureUrl,
        ...service.stateConnection,
      });
    }

    if (connection === 'connecting') {
      service.sendDataWebhook(Events.CONNECTION_UPDATE, {
        instance: service.instance.name,
        ...service.stateConnection,
      });
    }
  }

  public async createClient(service: any, number?: string): Promise<WASocket> {
    service.instance.authState = await this.defineAuthState(service);

    const session = this.configService.get<ConfigSessionPhone>('CONFIG_SESSION_PHONE');

    let browserOptions = {};

    if (number || service.phoneNumber) {
      service.phoneNumber = number;

      service.logger.info(`Phone number: ${number}`);
    } else {
      const browser: WABrowserDescription = [session.CLIENT, session.NAME, release()];
      browserOptions = { browser };

      service.logger.info(`Browser: ${browser}`);
    }

    const baileysVersion = await fetchLatestWaWebVersion({});
    const version = baileysVersion.version;
    const log = `Baileys version: ${version.join('.')}`;

    service.logger.info(log);

    service.logger.info(`Group Ignore: ${service.localSettings.groupsIgnore}`);

    let options;

    if (service.localProxy?.enabled) {
      service.logger.info('Proxy enabled: ' + service.localProxy?.host);

      if (service.localProxy?.host?.includes('proxyscrape')) {
        try {
          const response = await axios.get(service.localProxy?.host);
          const text = response.data;
          const proxyUrls = text.split('\r\n');
          const rand = Math.floor(Math.random() * Math.floor(proxyUrls.length));
          const proxyUrl = 'http://' + proxyUrls[rand];
          options = { agent: makeProxyAgent(proxyUrl), fetchAgent: makeProxyAgentUndici(proxyUrl) };
        } catch {
          service.localProxy.enabled = false;
        }
      } else {
        options = {
          agent: makeProxyAgent({
            host: service.localProxy.host,
            port: service.localProxy.port,
            protocol: service.localProxy.protocol,
            username: service.localProxy.username,
            password: service.localProxy.password,
          }),
          fetchAgent: makeProxyAgentUndici({
            host: service.localProxy.host,
            port: service.localProxy.port,
            protocol: service.localProxy.protocol,
            username: service.localProxy.username,
            password: service.localProxy.password,
          }),
        };
      }
    }

    const socketConfig: UserFacingSocketConfig = {
      ...options,
      version,
      logger: P({ level: service.logBaileys }),
      printQRInTerminal: false,
      auth: {
        creds: service.instance.authState.state.creds,
        keys: makeCacheableSignalKeyStore(service.instance.authState.state.keys, P({ level: 'error' }) as any),
      },
      msgRetryCounterCache: service.msgRetryCounterCache,
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => (await service.getMessage(key)) as Promise<proto.IMessage>,
      ...browserOptions,
      markOnlineOnConnect: service.localSettings.alwaysOnline,
      retryRequestDelayMs: 350,
      maxMsgRetryCount: 4,
      fireInitQueries: true,
      connectTimeoutMs: 30_000,
      keepAliveIntervalMs: 30_000,
      qrTimeout: 45_000,
      emitOwnEvents: false,
      shouldIgnoreJid: (jid) => {
        if (service.localSettings.syncFullHistory && isJidGroup(jid)) {
          return false;
        }

        const isGroupJid = service.localSettings.groupsIgnore && isJidGroup(jid);
        const isBroadcast = !service.localSettings.readStatus && isJidBroadcast(jid);
        const isNewsletter = isJidNewsletter(jid);

        return isGroupJid || isBroadcast || isNewsletter;
      },
      syncFullHistory: service.localSettings.syncFullHistory,
      shouldSyncHistoryMessage: (msg: proto.Message.IHistorySyncNotification) => {
        return service.historySyncNotification(msg);
      },
      cachedGroupMetadata: service.getGroupMetadataCache.bind(service),
      userDevicesCache: service.userDevicesCache,
      transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
      patchMessageBeforeSending(message) {
        if (
          message.deviceSentMessage?.message?.listMessage?.listType === proto.Message.ListMessage.ListType.PRODUCT_LIST
        ) {
          message = JSON.parse(JSON.stringify(message));
          message.deviceSentMessage.message.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
        }
        if (message.listMessage?.listType == proto.Message.ListMessage.ListType.PRODUCT_LIST) {
          message = JSON.parse(JSON.stringify(message));
          message.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
        }
        return message;
      },
    };

    service.endSession = false;

    service.client = makeWASocket(socketConfig);

    if (service.localSettings.wavoipToken && service.localSettings.wavoipToken.length > 0) {
      useVoiceCallsBaileys(
        service.localSettings.wavoipToken,
        service.client,
        service.connectionStatus.state as any,
        true,
      );
    }

    service.eventHandler();

    service.client.ws.on('CB:call', (packet: any) => {
      console.log('CB:call', packet);
      const payload = { event: 'CB:call', packet: packet };
      service.sendDataWebhook(Events.CALL, payload, true, ['websocket']);
    });

    service.client.ws.on('CB:ack,class:call', (packet: any) => {
      console.log('CB:ack,class:call', packet);
      const payload = { event: 'CB:ack,class:call', packet: packet };
      service.sendDataWebhook(Events.CALL, payload, true, ['websocket']);
    });

    service.phoneNumber = number;

    return service.client;
  }

  public async connectToWhatsapp(service: any, number?: string): Promise<WASocket> {
    try {
      service.loadChatwoot();
      service.loadSettings();
      service.loadWebhook();
      service.loadProxy();

      // Remontar o messageProcessor para garantir que está funcionando após reconexão
      if (service.eventHandlerService?.messageHandle?.['messages.upsert']) {
        service.messageProcessor.mount({
          onMessageReceive: service.eventHandlerService.messageHandle['messages.upsert'].bind(
            service.eventHandlerService,
          ),
        });
      } else {
        service.logger.warn('messageHandle ["messages.upsert"] not found in eventHandlerService during reconnection');
      }

      return await this.createClient(service, number);
    } catch (error) {
      service.logger.error(error);
      throw new InternalServerErrorException(error?.toString());
    }
  }

  public async reloadConnection(service: any): Promise<WASocket> {
    try {
      return await this.createClient(service, service.phoneNumber);
    } catch (error) {
      service.logger.error(error);
      throw new InternalServerErrorException(error?.toString());
    }
  }
}
