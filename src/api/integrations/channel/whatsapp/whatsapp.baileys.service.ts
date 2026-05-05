import { getCollectionsDto } from '@api/dto/business.dto';
import { OfferCallDto } from '@api/dto/call.dto';
import {
  ArchiveChatDto,
  BlockUserDto,
  DeleteMessage,
  getBase64FromMediaMessageDto,
  LastMessage,
  MarkChatUnreadDto,
  MuteChatDto,
  NumberBusiness,
  OnWhatsAppDto,
  PrivacySettingDto,
  ReadMessageDto,
  SendPresenceDto,
  UpdateMessageDto,
  WhatsAppNumberDto,
} from '@api/dto/chat.dto';
import {
  AcceptGroupInvite,
  CreateGroupDto,
  GetParticipant,
  GroupDescriptionDto,
  GroupInvite,
  GroupJid,
  GroupPictureDto,
  GroupSendInvite,
  GroupSubjectDto,
  GroupToggleEphemeralDto,
  GroupUpdateParticipantDto,
  GroupUpdateSettingDto,
} from '@api/dto/group.dto';
import { InstanceDto, SetPresenceDto } from '@api/dto/instance.dto';
import { HandleLabelDto, LabelDto } from '@api/dto/label.dto';
import {
  Button,
  ContactMessage,
  KeyType,
  MediaMessage,
  Options,
  SendAudioDto,
  SendButtonsDto,
  SendContactDto,
  SendListDto,
  SendLocationDto,
  SendMediaDto,
  SendPollDto,
  SendPtvDto,
  SendReactionDto,
  SendStatusDto,
  SendStickerDto,
  SendTextDto,
  StatusMessage,
  TypeButton,
} from '@api/dto/sendMessage.dto';
import { chatwootImport } from '@api/integrations/chatbot/chatwoot/utils/chatwoot-import-helper';
import * as s3Service from '@api/integrations/storage/s3/libs/minio.server';
import { ProviderFiles } from '@api/provider/sessions';
import { PrismaRepository, Query } from '@api/repository/repository.service';
import { chatbotController, waMonitor } from '@api/server.module';
import { CacheService } from '@api/services/cache.service';
import { ChannelStartupService } from '@api/services/channel.service';
import { Events, MessageSubtype, TypeMediaMessage, wa } from '@api/types/wa.types';
import { CacheEngine } from '@cache/cacheengine';
import {
  AudioConverter,
  CacheConf,
  Chatwoot,
  ConfigService,
  configService,
  ConfigSessionPhone,
  Database,
  Log,
  Openai,
  ProviderSession,
  QrCode,
  S3,
} from '@config/env.config';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@exceptions';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { Boom } from '@hapi/boom';
import { createId as cuid } from '@paralleldrive/cuid2';
import { Chat as PrismaChat, Contact as PrismaContact, Instance, Message, MessageUpdate } from '@prisma/client';
import { createJid } from '@utils/createJid';
import { fetchLatestWaWebVersion } from '@utils/fetchLatestWaWebVersion';
import { makeProxyAgent, makeProxyAgentUndici } from '@utils/makeProxyAgent';
import { getOnWhatsappCache, saveOnWhatsappCache } from '@utils/onWhatsappCache';
import { status } from '@utils/renderStatus';
import { sendTelemetry } from '@utils/sendTelemetry';
import useMultiFileAuthStatePrisma from '@utils/use-multi-file-auth-state-prisma';
import { AuthStateProvider } from '@utils/use-multi-file-auth-state-provider-files';
import { useMultiFileAuthStateRedisDb } from '@utils/use-multi-file-auth-state-redis-db';
import axios from 'axios';
import makeWASocket, {
  AnyMessageContent,
  BufferedEventData,
  BufferJSON,
  CacheStore,
  CatalogCollection,
  Chat,
  ConnectionState,
  Contact,
  decryptPollVote,
  delay,
  DisconnectReason,
  downloadContentFromMessage,
  downloadMediaMessage,
  generateWAMessageFromContent,
  getAggregateVotesInPollMessage,
  GetCatalogOptions,
  getContentType,
  getDevice,
  GroupMetadata,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isPnUser,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  MessageUpsertType,
  MessageUserReceiptUpdate,
  MiscMessageGenerationOptions,
  ParticipantAction,
  prepareWAMessageMedia,
  Product,
  proto,
  UserFacingSocketConfig,
  WABrowserDescription,
  WAMediaUpload,
  WAMessage,
  WAMessageKey,
  WAPresence,
  WASocket,
} from 'baileys';
import { Label } from 'baileys/lib/Types/Label';
import { LabelAssociation } from 'baileys/lib/Types/LabelAssociation';
import { spawn } from 'child_process';
import { isArray, isBase64, isURL } from 'class-validator';
import { createHash } from 'crypto';
import EventEmitter2 from 'eventemitter2';
import ffmpeg from 'fluent-ffmpeg';
import FormData from 'form-data';
import Long from 'long';
import mimeTypes from 'mime-types';
import NodeCache from 'node-cache';
import cron from 'node-cron';
import { release } from 'os';
import { join } from 'path';
import P from 'pino';
import qrcode, { QRCodeToDataURLOptions } from 'qrcode';
import sharp from 'sharp';
import { PassThrough, Readable } from 'stream';
import { v4 } from 'uuid';

import { BaileysMessageProcessor } from './baileysMessage.processor';
import { useVoiceCallsBaileys } from './voiceCalls/useVoiceCallsBaileys';

export interface ExtendedIMessageKey extends proto.IMessageKey {
  remoteJidAlt?: string;
  participantAlt?: string;
  server_id?: string;
  isViewOnce?: boolean;
}

const groupMetadataCache = new CacheService(new CacheEngine(configService, 'groups').getEngine());

// Adicione a fun\u00e7\u00e3o getVideoDuration no in\u00edcio do arquivo
async function getVideoDuration(input: Buffer | string | Readable): Promise<number> {
  const MediaInfoFactory = (await import('mediainfo.js')).default;
  const mediainfo = await MediaInfoFactory({ format: 'JSON' });

  let fileSize: number;
  let readChunk: (size: number, offset: number) => Promise<Buffer>;

  if (Buffer.isBuffer(input)) {
    fileSize = input.length;
    readChunk = async (size: number, offset: number): Promise<Buffer> => {
      return input.slice(offset, offset + size);
    };
  } else if (typeof input === 'string') {
    const fs = await import('fs');
    const stat = await fs.promises.stat(input);
    fileSize = stat.size;
    const fd = await fs.promises.open(input, 'r');

    readChunk = async (size: number, offset: number): Promise<Buffer> => {
      const buffer = Buffer.alloc(size);
      await fd.read(buffer, 0, size, offset);
      return buffer;
    };

    try {
      const result = await mediainfo.analyzeData(() => fileSize, readChunk);
      const jsonResult = JSON.parse(result);

      const generalTrack = jsonResult.media.track.find((t: any) => t['@type'] === 'General');
      const duration = generalTrack.Duration;

      return Math.round(parseFloat(duration));
    } finally {
      await fd.close();
    }
  } else if (input instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of input) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks);
    fileSize = data.length;

    readChunk = async (size: number, offset: number): Promise<Buffer> => {
      return data.slice(offset, offset + size);
    };
  } else {
    throw new Error('Tipo de entrada n\u00e3o suportado');
  }

  const result = await mediainfo.analyzeData(() => fileSize, readChunk);
  const jsonResult = JSON.parse(result);

  const generalTrack = jsonResult.media.track.find((t: any) => t['@type'] === 'General');
  const duration = generalTrack.Duration;

  return Math.round(parseFloat(duration));
}

export class BaileysStartupService extends ChannelStartupService {
  private messageProcessor = new BaileysMessageProcessor();

  constructor(
    public readonly configService: ConfigService,
    public readonly eventEmitter: EventEmitter2,
    public readonly prismaRepository: PrismaRepository,
    public readonly cache: CacheService,
    public readonly chatwootCache: CacheService,
    public readonly baileysCache: CacheService,
    private readonly providerFiles: ProviderFiles,
  ) {
    super(configService, eventEmitter, prismaRepository, chatwootCache);
    this.instance.qrcode = { count: 0 };
    this.messageProcessor.mount({
      onMessageReceive: this.messageHandle['messages.upsert'].bind(this), // Bind the method to the current context
    });

    this.authStateProvider = new AuthStateProvider(this.providerFiles);
  }

  private authStateProvider: AuthStateProvider;
  private readonly msgRetryCounterCache: CacheStore = new NodeCache();
  private readonly userDevicesCache: CacheStore = new NodeCache({ stdTTL: 300000, useClones: false });
  private endSession = false;
  private logBaileys = this.configService.get<Log>('LOG').BAILEYS;
  private eventProcessingQueue: Promise<void> = Promise.resolve();

  // Cache TTL constants (in seconds)
  private readonly MESSAGE_CACHE_TTL_SECONDS = 5 * 60; // 5 minutes - avoid duplicate message processing
  private readonly UPDATE_CACHE_TTL_SECONDS = 30 * 60; // 30 minutes - avoid duplicate status updates

  public stateConnection: wa.StateConnection = { state: 'close' };

  public phoneNumber: string;

  public get connectionStatus() {
    return this.stateConnection;
  }

  public async logoutInstance() {
    this.messageProcessor.onDestroy();
    await this.client?.logout('Log out instance: ' + this.instanceName);

    this.client?.ws?.close();

    const db = this.configService.get<Database>('DATABASE');
    const cache = this.configService.get<CacheConf>('CACHE');
    const provider = this.configService.get<ProviderSession>('PROVIDER');

    if (provider?.ENABLED) {
      const authState = await this.authStateProvider.authStateProvider(this.instance.id);

      await authState.removeCreds();
    }

    if (cache?.REDIS.ENABLED && cache?.REDIS.SAVE_INSTANCES) {
      const authState = await useMultiFileAuthStateRedisDb(this.instance.id, this.cache);

      await authState.removeCreds();
    }

    if (db.SAVE_DATA.INSTANCE) {
      const authState = await useMultiFileAuthStatePrisma(this.instance.id, this.cache);

      await authState.removeCreds();
    }

    const sessionExists = await this.prismaRepository.session.findFirst({ where: { sessionId: this.instanceId } });
    if (sessionExists) {
      await this.prismaRepository.session.delete({ where: { sessionId: this.instanceId } });
    }
  }

  public async getProfileName() {
    let profileName = this.client.user?.name ?? this.client.user?.verifiedName;
    if (!profileName) {
      const data = await this.prismaRepository.session.findUnique({ where: { sessionId: this.instanceId } });

      if (data) {
        const creds = JSON.parse(JSON.stringify(data.creds), BufferJSON.reviver);
        profileName = creds.me?.name || creds.me?.verifiedName;
      }
    }

    return profileName;
  }

  public async getProfileStatus() {
    const status = await this.client.fetchStatus(this.instance.wuid);

    return status[0]?.status;
  }

  public get profilePictureUrl() {
    return this.instance.profilePictureUrl;
  }

  public get qrCode(): wa.QrCode {
    return {
      pairingCode: this.instance.qrcode?.pairingCode,
      code: this.instance.qrcode?.code,
      base64: this.instance.qrcode?.base64,
      count: this.instance.qrcode?.count,
    };
  }

  private async connectionUpdate({ qr, connection, lastDisconnect }: Partial<ConnectionState>) {
    if (qr) {
      if (this.instance.qrcode.count === this.configService.get<QrCode>('QRCODE').LIMIT) {
        this.sendDataWebhook(Events.QRCODE_UPDATED, {
          message: 'QR code limit reached, please login again',
          statusCode: DisconnectReason.badSession,
        });

        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
          this.chatwootService.eventWhatsapp(
            Events.QRCODE_UPDATED,
            { instanceName: this.instance.name, instanceId: this.instanceId },
            { message: 'QR code limit reached, please login again', statusCode: DisconnectReason.badSession },
          );
        }

        this.sendDataWebhook(Events.CONNECTION_UPDATE, {
          instance: this.instance.name,
          state: 'refused',
          statusReason: DisconnectReason.connectionClosed,
          wuid: this.instance.wuid,
          profileName: await this.getProfileName(),
          profilePictureUrl: this.instance.profilePictureUrl,
        });

        this.endSession = true;

        return this.eventEmitter.emit('no.connection', this.instance.name);
      }

      this.instance.qrcode.count++;

      const color = this.configService.get<QrCode>('QRCODE').COLOR;

      const optsQrcode: QRCodeToDataURLOptions = {
        margin: 3,
        scale: 4,
        errorCorrectionLevel: 'H',
        color: { light: '#ffffff', dark: color },
      };

      if (this.phoneNumber) {
        await delay(1000);
        this.instance.qrcode.pairingCode = await this.client.requestPairingCode(this.phoneNumber);
      } else {
        this.instance.qrcode.pairingCode = null;
      }

      qrcode.toDataURL(qr, optsQrcode, (error, base64) => {
        if (error) {
          this.logger.error('Qrcode generate failed:' + error.toString());
          return;
        }

        this.instance.qrcode.base64 = base64;
        this.instance.qrcode.code = qr;

        this.sendDataWebhook(Events.QRCODE_UPDATED, {
          qrcode: { instance: this.instance.name, pairingCode: this.instance.qrcode.pairingCode, code: qr, base64 },
        });

        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
          this.chatwootService.eventWhatsapp(
            Events.QRCODE_UPDATED,
            { instanceName: this.instance.name, instanceId: this.instanceId },
            {
              qrcode: { instance: this.instance.name, pairingCode: this.instance.qrcode.pairingCode, code: qr, base64 },
            },
          );
        }
      });

      // QR rendering is handled by the frontend (base64) to avoid leaking QR codes in server logs.

      await this.prismaRepository.instance.update({
        where: { id: this.instanceId },
        data: { connectionStatus: 'connecting' },
      });
    }

    if (connection) {
      this.stateConnection = {
        state: connection,
        statusReason: (lastDisconnect?.error as Boom)?.output?.statusCode ?? 200,
      };
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const codesToNotReconnect = [DisconnectReason.loggedOut, DisconnectReason.forbidden, 402, 406];
      const shouldReconnect = !codesToNotReconnect.includes(statusCode);
      if (shouldReconnect) {
        await this.connectToWhatsapp(this.phoneNumber);
      } else {
        this.sendDataWebhook(Events.STATUS_INSTANCE, {
          instance: this.instance.name,
          status: 'closed',
          disconnectionAt: new Date(),
          disconnectionReasonCode: statusCode,
          disconnectionObject: JSON.stringify(lastDisconnect),
        });

        await this.prismaRepository.instance.update({
          where: { id: this.instanceId },
          data: {
            connectionStatus: 'close',
            disconnectionAt: new Date(),
            disconnectionReasonCode: statusCode,
            disconnectionObject: JSON.stringify(lastDisconnect),
          },
        });

        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
          this.chatwootService.eventWhatsapp(
            Events.STATUS_INSTANCE,
            { instanceName: this.instance.name, instanceId: this.instanceId },
            { instance: this.instance.name, status: 'closed' },
          );
        }

        this.eventEmitter.emit('logout.instance', this.instance.name, 'inner');
        this.client?.ws?.close();
        this.client.end(new Error('Close connection'));

        this.sendDataWebhook(Events.CONNECTION_UPDATE, { instance: this.instance.name, ...this.stateConnection });
      }
    }

    if (connection === 'open') {
      this.instance.wuid = this.client.user.id.replace(/:\d+/, '');
      try {
        const profilePic = await this.profilePicture(this.instance.wuid);
        this.instance.profilePictureUrl = profilePic.profilePictureUrl;
      } catch {
        this.instance.profilePictureUrl = null;
      }
      const formattedWuid = this.instance.wuid.split('@')[0].padEnd(30, ' ');
      const formattedName = this.instance.name;
      this.logger.info(
        `
        \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
        \u2502    CONNECTED TO WHATSAPP     \u2502
        \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518`.replace(
          /^ +/gm,
          '  ',
        ),
      );
      this.logger.info(
        `
        wuid: ${formattedWuid}
        name: ${formattedName}
      `,
      );

      await this.prismaRepository.instance.update({
        where: { id: this.instanceId },
        data: {
          ownerJid: this.instance.wuid,
          number: this.instance.wuid?.split('@')?.[0] || null,
          profileName: (await this.getProfileName()) as string,
          profilePicUrl: this.instance.profilePictureUrl,
          connectionStatus: 'open',
        },
      });

      if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
        this.chatwootService.eventWhatsapp(
          Events.CONNECTION_UPDATE,
          { instanceName: this.instance.name, instanceId: this.instanceId },
          { instance: this.instance.name, status: 'open' },
        );
        this.syncChatwootLostMessages();
      }

      this.sendDataWebhook(Events.CONNECTION_UPDATE, {
        instance: this.instance.name,
        wuid: this.instance.wuid,
        profileName: await this.getProfileName(),
        profilePictureUrl: this.instance.profilePictureUrl,
        ...this.stateConnection,
      });
    }

    if (connection === 'connecting') {
      this.sendDataWebhook(Events.CONNECTION_UPDATE, { instance: this.instance.name, ...this.stateConnection });
    }
  }

  private async getMessage(key: proto.IMessageKey, full = false) {
    try {
      // Use raw SQL to avoid JSON path issues
      const webMessageInfo = (await this.prismaRepository.$queryRaw`
        SELECT * FROM "Message"
        WHERE "instanceId" = ${this.instanceId}
        AND "key"->>'id' = ${key.id}
      `) as proto.IWebMessageInfo[];

      if (full) {
        return webMessageInfo[0];
      }
      if (webMessageInfo[0].message?.pollCreationMessage) {
        const messageSecretBase64 = webMessageInfo[0].message?.messageContextInfo?.messageSecret;

        if (typeof messageSecretBase64 === 'string') {
          const messageSecret = Buffer.from(messageSecretBase64, 'base64');

          const msg = {
            messageContextInfo: { messageSecret },
            pollCreationMessage: webMessageInfo[0].message?.pollCreationMessage,
          };

          return msg;
        }
      }

      return webMessageInfo[0].message;
    } catch {
      return { conversation: '' };
    }
  }

  private async defineAuthState() {
    const db = this.configService.get<Database>('DATABASE');
    const cache = this.configService.get<CacheConf>('CACHE');

    const provider = this.configService.get<ProviderSession>('PROVIDER');

    if (provider?.ENABLED) {
      return await this.authStateProvider.authStateProvider(this.instance.id);
    }

    if (cache?.REDIS.ENABLED && cache?.REDIS.SAVE_INSTANCES) {
      this.logger.info('Redis enabled');
      return await useMultiFileAuthStateRedisDb(this.instance.id, this.cache);
    }

    if (db.SAVE_DATA.INSTANCE) {
      return await useMultiFileAuthStatePrisma(this.instance.id, this.cache);
    }
  }

  private async createClient(number?: string): Promise<WASocket> {
    this.instance.authState = await this.defineAuthState();

    const session = this.configService.get<ConfigSessionPhone>('CONFIG_SESSION_PHONE');

    let browserOptions = {};

    if (number || this.phoneNumber) {
      this.phoneNumber = number;

      this.logger.info(`Phone number: ${number}`);
    } else {
      const browser: WABrowserDescription = [session.CLIENT, session.NAME, release()];
      browserOptions = { browser };

      this.logger.info(`Browser: ${browser}`);
    }

    const baileysVersion = await fetchLatestWaWebVersion({});
    const version = baileysVersion.version;
    const log = `Baileys version: ${version.join('.')}`;

    this.logger.info(log);

    this.logger.info(`Group Ignore: ${this.localSettings.groupsIgnore}`);

    let options;

    if (this.localProxy?.enabled) {
      this.logger.info('Proxy enabled: ' + this.localProxy?.host);

      if (this.localProxy?.host?.includes('proxyscrape')) {
        try {
          const response = await axios.get(this.localProxy?.host);
          const text = response.data;
          const proxyUrls = text.split('\r\n');
          const rand = Math.floor(Math.random() * Math.floor(proxyUrls.length));
          const proxyUrl = 'http://' + proxyUrls[rand];
          options = { agent: makeProxyAgent(proxyUrl), fetchAgent: makeProxyAgentUndici(proxyUrl) };
        } catch {
          this.localProxy.enabled = false;
        }
      } else {
        options = {
          agent: makeProxyAgent({
            host: this.localProxy.host,
            port: this.localProxy.port,
            protocol: this.localProxy.protocol,
            username: this.localProxy.username,
            password: this.localProxy.password,
          }),
          fetchAgent: makeProxyAgentUndici({
            host: this.localProxy.host,
            port: this.localProxy.port,
            protocol: this.localProxy.protocol,
            username: this.localProxy.username,
            password: this.localProxy.password,
          }),
        };
      }
    }

    const socketConfig: UserFacingSocketConfig = {
      ...options,
      version,
      logger: P({ level: this.logBaileys }),
      printQRInTerminal: false,
      auth: {
        creds: this.instance.authState.state.creds,
        keys: makeCacheableSignalKeyStore(this.instance.authState.state.keys, P({ level: 'error' }) as any),
      },
      msgRetryCounterCache: this.msgRetryCounterCache,
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => (await this.getMessage(key)) as Promise<proto.IMessage>,
      ...browserOptions,
      markOnlineOnConnect: this.localSettings.alwaysOnline,
      retryRequestDelayMs: 350,
      maxMsgRetryCount: 4,
      fireInitQueries: true,
      connectTimeoutMs: 30_000,
      keepAliveIntervalMs: 30_000,
      qrTimeout: 45_000,
      emitOwnEvents: false,
      shouldIgnoreJid: (jid) => {
        if (this.localSettings.syncFullHistory && isJidGroup(jid)) {
          return false;
        }

        const isGroupJid = this.localSettings.groupsIgnore && isJidGroup(jid);
        const isBroadcast = !this.localSettings.readStatus && isJidBroadcast(jid);
        const isNewsletter = isJidNewsletter(jid);

        return isGroupJid || isBroadcast || isNewsletter;
      },
      syncFullHistory: this.localSettings.syncFullHistory,
      shouldSyncHistoryMessage: (msg: proto.Message.IHistorySyncNotification) => {
        return this.historySyncNotification(msg);
      },
      cachedGroupMetadata: this.getGroupMetadataCache,
      userDevicesCache: this.userDevicesCache,
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

    this.endSession = false;

    this.client = makeWASocket(socketConfig);

    if (this.localSettings.wavoipToken && this.localSettings.wavoipToken.length > 0) {
      useVoiceCallsBaileys(this.localSettings.wavoipToken, this.client, this.connectionStatus.state as any, true);
    }

    this.eventHandler();

    this.client.ws.on('CB:call', (packet) => {
      console.log('CB:call', packet);
      const payload = { event: 'CB:call', packet: packet };
      this.sendDataWebhook(Events.CALL, payload, true, ['websocket']);
    });

    this.client.ws.on('CB:ack,class:call', (packet) => {
      console.log('CB:ack,class:call', packet);
      const payload = { event: 'CB:ack,class:call', packet: packet };
      this.sendDataWebhook(Events.CALL, payload, true, ['websocket']);
    });

    this.phoneNumber = number;

    return this.client;
  }

  public async connectToWhatsapp(number?: string): Promise<WASocket> {
    try {
      this.loadChatwoot();
      this.loadSettings();
      this.loadWebhook();
      this.loadProxy();

      // Remontar o messageProcessor para garantir que est\u00e1 funcionando ap\u00f3s reconex\u00e3o
      this.messageProcessor.mount({
        onMessageReceive: this.messageHandle['messages.upsert'].bind(this),
      });

      return await this.createClient(number);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.toString());
    }
  }

  public async reloadConnection(): Promise<WASocket> {
    try {
      return await this.createClient(this.phoneNumber);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.toString());
    }
  }

  private readonly chatHandle = {
    'chats.upsert': async (chats: Chat[]) => {
      const existingChatIds = await this.prismaRepository.chat.findMany({
        where: { instanceId: this.instanceId },
        select: { remoteJid: true },
      });

      const existingChatIdSet = new Set(existingChatIds.map((chat) => chat.remoteJid));

      const chatsToInsert = chats
        .filter((chat) => !existingChatIdSet?.has(chat.id))
        .map((chat) => ({
          remoteJid: chat.id,
          instanceId: this.instanceId,
          name: chat.name,
          unreadMessages: chat.unreadCount !== undefined ? chat.unreadCount : 0,
        }));

      this.sendDataWebhook(Events.CHATS_UPSERT, chatsToInsert);

      if (chatsToInsert.length > 0) {
        if (this.configService.get<Database>('DATABASE').SAVE_DATA.CHATS)
          await this.prismaRepository.chat.createMany({ data: chatsToInsert, skipDuplicates: true });
      }
    },

    'chats.update': async (
      chats: Partial<
        proto.IConversation & { lastMessageRecvTimestamp?: number } & {
          conditional: (bufferedData: BufferedEventData) => boolean;
        }
      >[],
    ) => {
      const chatsRaw = chats.map((chat) => {
        return { remoteJid: chat.id, instanceId: this.instanceId };
      });

      this.sendDataWebhook(Events.CHATS_UPDATE, chatsRaw);

      for (const chat of chats) {
        await this.prismaRepository.chat.updateMany({
          where: { instanceId: this.instanceId, remoteJid: chat.id, name: chat.name },
          data: { remoteJid: chat.id },
        });
      }
    },

    'chats.delete': async (chats: string[]) => {
      chats.forEach(
        async (chat) =>
          await this.prismaRepository.chat.deleteMany({ where: { instanceId: this.instanceId, remoteJid: chat } }),
      );

      this.sendDataWebhook(Events.CHATS_DELETE, [...chats]);
    },
  };

  private async eventHandler() {
    this.client.ev.process(async (events) => {
      if (events['connection.update']) {
        await this.connectionUpdate(events['connection.update']);
      }

      if (events['creds.update']) {
        await this.instance.authState.saveCreds();
      }

      if (events['messaging-history.set']) {
        const { chats, contacts, messages, isLatest } = events['messaging-history.set'];
        this.logger.warn(
          `History sync: ${chats.length} chats, ${contacts.length} contacts, ${messages.length} messages`,
        );

        // Save contacts from history sync
        for (const contact of contacts) {
          const name = contact.name || contact.verifiedName || contact.notify;
          if (!name) continue; // Skip contacts without a name
          await this.prismaRepository.contact.upsert({
            where: {
              instanceId_remoteJid: {
                instanceId: this.instanceId,
                remoteJid: contact.id,
              },
            },
            update: { pushName: name, profilePicUrl: contact.imgUrl || undefined },
            create: {
              instanceId: this.instanceId,
              remoteJid: contact.id,
              pushName: name,
              profilePicUrl: contact.imgUrl || undefined,
            },
          });
        }
      }

      if (events['contacts.upsert']) {
        const contacts = events['contacts.upsert'];
        for (const contact of contacts) {
          const name = contact.name || contact.verifiedName || contact.notify;
          await this.prismaRepository.contact.upsert({
            where: {
              instanceId_remoteJid: {
                instanceId: this.instanceId,
                remoteJid: contact.id,
              },
            },
            update: { pushName: name, profilePicUrl: contact.imgUrl || undefined },
            create: {
              instanceId: this.instanceId,
              remoteJid: contact.id,
              pushName: name,
              profilePicUrl: contact.imgUrl || undefined,
            },
          });
        }
      }

      if (events['messages.upsert']) {
        this.messageProcessor.processMessage(events['messages.upsert'], this.localSettings);
      }

      if (events['messages.update']) {
        for (const { key, update } of events['messages.update']) {
          if (update.status) {
            await this.prismaRepository.messageUpdate.create({
              data: {
                instanceId: this.instanceId,
                remoteJid: key.remoteJid,
                keyId: key.id,
                messageId: key.id,
                fromMe: key.fromMe || false,
                status: status[update.status],
                dateTime: new Date(),
              },
            });

            this.sendDataWebhook(Events.MESSAGES_UPDATE, {
              instance: this.instance.name,
              remoteJid: key.remoteJid,
              id: key.id,
              status: status[update.status],
            });
          }
        }
      }

      if (events['chats.upsert']) {
        await this.chatHandle['chats.upsert'](events['chats.upsert']);
      }

      if (events['chats.update']) {
        await this.chatHandle['chats.update'](events['chats.update']);
      }

      if (events['chats.delete']) {
        await this.chatHandle['chats.delete'](events['chats.delete']);
      }

      if (events['presence.update']) {
        const { id, presences } = events['presence.update'];
        this.sendDataWebhook(Events.PRESENCE_UPDATE, { remoteJid: id, presences });
      }
    });
  }

  private readonly messageHandle = {
    'messages.upsert': async (m: { messages: WAMessage[]; type: MessageUpsertType }) => {
      if (m.type === 'append') return;

      for (const msg of m.messages) {
        if (!msg.message) continue;

        const remoteJid = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const id = msg.key.id;

        // Process message content
        const messageType = getContentType(msg.message);
        if (!messageType) continue;

        // Save to DB
        await this.prismaRepository.message.upsert({
          where: {
            instanceId_keyId: {
              instanceId: this.instanceId,
              keyId: id,
            },
          },
          update: {
            message: msg.message as any,
            pushName: msg.pushName || undefined,
          },
          create: {
            instanceId: this.instanceId,
            keyId: id,
            key: msg.key as any,
            message: msg.message as any,
            messageType,
            messageTimestamp: msg.messageTimestamp as number,
            pushName: msg.pushName || undefined,
            source: 'whatsapp',
          },
        });

        // Update Chat last message
        await this.prismaRepository.chat.upsert({
          where: {
            instanceId_remoteJid: {
              instanceId: this.instanceId,
              remoteJid,
            },
          },
          update: {
            ...(msg.pushName ? { name: msg.pushName } : {}),
            lastMessage: msg.message as any,
            lastMessageTimestamp: msg.messageTimestamp as number,
            unreadMessages: fromMe ? 0 : { increment: 1 },
          },
          create: {
            instanceId: this.instanceId,
            remoteJid,
            name: msg.pushName || undefined,
            lastMessage: msg.message as any,
            lastMessageTimestamp: msg.messageTimestamp as number,
            unreadMessages: fromMe ? 0 : 1,
          },
        });

        // Webhook
        this.sendDataWebhook(Events.MESSAGES_UPSERT, {
          instance: this.instance.name,
          message: msg,
        });

        // Chatwoot integration
        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
          // Send to chatwoot
        }
      }
    },
  };

  public async findChatByRemoteJid(remoteJid: string) {
    const chat = await this.prismaRepository.chat.findUnique({
      where: {
        instanceId_remoteJid: {
          instanceId: this.instanceId,
          remoteJid,
        },
      },
    });

    if (!chat) return null;

    const contact = await this.prismaRepository.contact.findUnique({
      where: {
        instanceId_remoteJid: {
          instanceId: this.instanceId,
          remoteJid,
        },
      },
    });

    return {
      ...chat,
      pushName: contact?.pushName || chat.name || remoteJid.split('@')[0],
      profilePicUrl: contact?.profilePicUrl,
    };
  }

  public async fetchInternalNotes(remoteJid: string) {
    return await this.prismaRepository.internalNote.findMany({
      where: {
        instanceId: this.instanceId,
        remoteJid,
      },
      include: {
        User: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async createInternalNote(remoteJid: string, content: string, userId: string) {
    const chat = await this.findChatByRemoteJid(remoteJid);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return await this.prismaRepository.internalNote.create({
      data: {
        instanceId: this.instanceId,
        remoteJid,
        content,
        userId,
        chatId: chat.id,
      },
      include: {
        User: true,
      },
    });
  }

  public async updateControlMode(remoteJid: string, mode: 'AI' | 'HUMAN') {
    return await this.prismaRepository.chat.update({
      where: {
        instanceId_remoteJid: {
          instanceId: this.instanceId,
          remoteJid,
        },
      },
      data: { controlMode: mode },
    });
  }

  public async updateContact(remoteJid: string, data: { pushName?: string; phoneNumber?: string; email?: string }) {
    const contact = await this.prismaRepository.contact.upsert({
      where: {
        instanceId_remoteJid: {
          instanceId: this.instanceId,
          remoteJid,
        },
      },
      update: data,
      create: {
        instanceId: this.instanceId,
        remoteJid,
        ...data,
      },
    });

    // Also update Chat name if pushName is provided
    if (data.pushName) {
      await this.prismaRepository.chat.update({
        where: {
          instanceId_remoteJid: {
            instanceId: this.instanceId,
            remoteJid,
          },
        },
        data: { name: data.pushName },
      });
    }

    return contact;
  }

  public async muteChat(data: MuteChatDto) {
    try {
      const jid = createJid(data.remoteJid);
      await this.client.chatModify({ mute: data.muteTime ?? -1 }, jid);
      return { chatId: data.remoteJid, muted: true };
    } catch (error) {
      throw new InternalServerErrorException({
        muted: false,
        message: ['An error occurred while muting the chat.', error.toString()],
      });
    }
  }

  public async deleteChat(remoteJid: string) {
    try {
      const jid = createJid(remoteJid);
      await this.client.chatModify({ delete: true, lastMessages: [] }, jid);

      // Also delete from local database
      const instance = await this.prismaRepository.instance.findUnique({ where: { name: this.instance.name } });
      if (instance) {
        await this.prismaRepository.chat.deleteMany({
          where: { instanceId: instance.id, remoteJid: remoteJid },
        });
        await this.prismaRepository.message.deleteMany({
          where: {
            instanceId: instance.id,
            key: {
              path: ['remoteJid'],
              equals: remoteJid,
            },
          },
        });
      }

      return { chatId: remoteJid, deleted: true };
    } catch (error) {
      throw new InternalServerErrorException({
        deleted: false,
        message: ['An error occurred while deleting the chat.', error.toString()],
      });
    }
  }

  public async deleteMessage(del: DeleteMessage) {
    try {
      const response = await this.client.sendMessage(del.remoteJid, { delete: del });

      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error deleteMessage', error.toString());
    }
  }

  public async fetchBusinessProfile(jid?: string) {
    try {
      jid = jid ? createJid(jid) : this.instance.wuid;

      const business = await this.client.getBusinessProfile(jid);

      if (!business) {
        return { isBusiness: false };
      }

      return { isBusiness: true, ...business };
    } catch (error) {
      throw new InternalServerErrorException('Error fetchBusinessProfile', error.toString());
    }
  }

  public async profilePicture(jid?: string) {
    try {
      jid = jid ? createJid(jid) : this.instance.wuid;

      const profilePictureUrl = await this.client.profilePictureUrl(jid, 'image');

      return { profilePictureUrl };
    } catch {
      return { profilePictureUrl: null };
    }
  }

  public async fetchProfile(instanceName: string, number: string) {
    const jid = createJid(number);

    try {
      const onWhatsapp = (await this.whatsappNumber({ numbers: [jid] }))?.shift();

      if (!onWhatsapp.exists) {
        throw new BadRequestException(onWhatsapp);
      }

      const info = (await this.whatsappNumber({ numbers: [jid] }))?.shift();
      const profilePic = await this.profilePicture(info?.jid);
      const business = await this.fetchBusinessProfile(info?.jid);

      return {
        wuid: info?.jid || jid,
        name: info?.name,
        numberExists: info?.exists,
        profilePicUrl: profilePic.profilePictureUrl,
        isBusiness: business.isBusiness,
        businessProfile: business.isBusiness ? business : null,
      };
    } catch {
      return { wuid: jid, name: null, isBusiness: false };
    }
  }

  public async whatsappNumber(data: WhatsAppNumberDto) {
    try {
      const numbers = data.numbers.map((number) => createJid(number));
      const onWhatsapp = await this.client.onWhatsApp(...numbers);

      const response = onWhatsapp.map((number) => {
        return new OnWhatsAppDto(number.jid, number.exists, number.jid.split('@')[0]);
      });

      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error whatsappNumber', error.toString());
    }
  }

  public async markMessageAsRead(data: ReadMessageDto) {
    try {
      for (const key of data.readMessages) {
        await this.client.readMessages([key]);
      }

      return { message: 'Messages read' };
    } catch (error) {
      throw new InternalServerErrorException('Error markMessageAsRead', error.toString());
    }
  }

  public async archiveChat(data: ArchiveChatDto) {
    try {
      const jid = createJid(data.chat);
      await this.client.chatModify({ archive: data.archive, lastMessages: [data.lastMessage] }, jid);

      return { message: 'Chat archived' };
    } catch (error) {
      throw new InternalServerErrorException('Error archiveChat', error.toString());
    }
  }

  public async markChatUnread(data: MarkChatUnreadDto) {
    try {
      const jid = createJid(data.chat);
      await this.client.chatModify({ markRead: false, lastMessages: [data.lastMessage] }, jid);

      return { message: 'Chat marked as unread' };
    } catch (error) {
      throw new InternalServerErrorException('Error markChatUnread', error.toString());
    }
  }

  public async blockUser(data: BlockUserDto) {
    try {
      const jid = createJid(data.number);
      await this.client.updateBlockStatus(jid, data.status);

      return { message: 'User updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error blockUser', error.toString());
    }
  }

  public async fetchContacts(query: Query<PrismaContact>) {
    const where = { instanceId: this.instanceId, remoteJid: query?.where?.remoteJid };
    const contacts = await this.prismaRepository.contact.findMany({
      where,
      orderBy: { pushName: 'asc' },
      skip: (query.offset || 50) * ((query?.page || 1) === 1 ? 0 : (query?.page as number) - 1),
      take: query.offset || 50,
    });

    return contacts.map((contact) => ({
      ...contact,
      isGroup: contact.remoteJid.endsWith('@g.us'),
      isSaved: !!contact.pushName || !!contact.profilePicUrl,
      type: contact.remoteJid.endsWith('@g.us') ? 'group' : contact.pushName ? 'contact' : 'group_member',
    }));
  }

  public async fetchChats(query: Query<PrismaContact>) {
    const count = await this.prismaRepository.chat.count({
      where: { instanceId: this.instanceId, remoteJid: query?.where?.remoteJid },
    });

    if (!query?.offset) {
      query.offset = 50;
    }

    if (!query?.page) {
      query.page = 1;
    }

    const chats = await this.prismaRepository.chat.findMany({
      where: { instanceId: this.instanceId, remoteJid: query?.where?.remoteJid },
      orderBy: { lastMessageTimestamp: 'desc' },
      skip: query.offset * (query?.page === 1 ? 0 : (query?.page as number) - 1),
      take: query.offset,
    });

    const contactJids = chats.map((c) => c.remoteJid);
    const contacts = await this.prismaRepository.contact.findMany({
      where: {
        instanceId: this.instanceId,
        remoteJid: { in: contactJids },
      },
    });

    return chats.map((chat) => {
      const contact = contacts.find((c) => c.remoteJid === chat.remoteJid);
      return {
        ...chat,
        pushName: contact?.pushName || chat.name || chat.remoteJid.split('@')[0],
        profilePicUrl: contact?.profilePicUrl,
      };
    }) as any;
  }

  public async fetchStatusMessage(query: Query<MessageUpdate>) {
    const count = await this.prismaRepository.messageUpdate.count({
      where: { instanceId: this.instanceId, messageId: query?.where?.messageId },
    });

    if (!query?.offset) {
      query.offset = 50;
    }

    if (!query?.page) {
      query.page = 1;
    }

    const messages = await this.prismaRepository.messageUpdate.findMany({
      where: { instanceId: this.instanceId, messageId: query?.where?.messageId },
      orderBy: { dateTime: 'desc' },
      skip: query.offset * (query?.page === 1 ? 0 : (query?.page as number) - 1),
      take: query.offset,
    });

    return messages;
  }

  public async fetchPrivacySettings() {
    try {
      const response = await this.client.fetchPrivacySettings();

      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error fetchPrivacySettings', error.toString());
    }
  }

  public async updatePrivacySettings(data: PrivacySettingDto) {
    try {
      if (data.last) await this.client.updateLastSeenPrivacy(data.last);
      if (data.online) await this.client.updateOnlinePrivacy(data.online);
      if (data.profile) await this.client.updateProfilePicturePrivacy(data.profile);
      if (data.status) await this.client.updateStatusPrivacy(data.status);
      if (data.readreceipts) await this.client.updateReadReceiptsPrivacy(data.readreceipts);
      if (data.groupadd) await this.client.updateGroupsAddPrivacy(data.groupadd);

      return { message: 'Privacy settings updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error updatePrivacySettings', error.toString());
    }
  }

  public async sendPresence(data: SendPresenceDto) {
    try {
      const jid = createJid(data.number);
      await this.client.presenceSubscribe(jid);
      await delay(data.delay);

      await this.client.sendPresenceUpdate(data.presence, jid);

      return { message: 'Presence sent' };
    } catch (error) {
      throw new InternalServerErrorException('Error sendPresence', error.toString());
    }
  }

  public async updateProfileName(name: string) {
    try {
      await this.client.updateProfileName(name);

      return { message: 'Profile name updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error updateProfileName', error.toString());
    }
  }

  public async updateProfileStatus(status: string) {
    try {
      await this.client.updateProfileStatus(status);

      return { message: 'Profile status updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error updateProfileStatus', error.toString());
    }
  }

  public async updateProfilePicture(picture: string) {
    try {
      const jid = this.instance.wuid;
      const buffer = isBase64(picture) ? Buffer.from(picture, 'base64') : picture;

      await this.client.updateProfilePicture(jid, { url: picture });

      return { message: 'Profile picture updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error updateProfilePicture', error.toString());
    }
  }

  public async removeProfilePicture() {
    try {
      const jid = this.instance.wuid;
      await this.client.removeProfilePicture(jid);

      return { message: 'Profile picture removed' };
    } catch (error) {
      throw new InternalServerErrorException('Error removeProfilePicture', error.toString());
    }
  }

  public async updateMessage(data: UpdateMessageDto) {
    try {
      const jid = createJid(data.number);
      const response = await this.client.sendMessage(jid, { edit: data.key, text: data.text });

      return response;
    } catch (error) {
      throw new InternalServerErrorException('Error updateMessage', error.toString());
    }
  }

  public async getGroupMetadataCache(jid: string): Promise<GroupMetadata> {
    const groupMetadata = await groupMetadataCache.get<GroupMetadata>(jid);
    if (!groupMetadata) {
      const metadata = await this.client.groupMetadata(jid);
      await groupMetadataCache.set(jid, metadata, 300);
      return metadata;
    }
    return groupMetadata;
  }

  public historySyncNotification(msg: proto.Message.IHistorySyncNotification) {
    const syncType = msg.syncType;
    console.log(`History sync notification: ${syncType}`);
    return true;
  }

  public async syncChatwootLostMessages() {
    // Logic to sync lost messages when reconnected
  }

  public async baileysGetAuthState() {
    const response = { me: this.client.authState.creds.me, account: this.client.authState.creds.account };

    return response;
  }

  //Business Controller
  public async fetchCatalog(instanceName: string, data: getCollectionsDto) {
    const jid = data.number ? createJid(data.number) : this.client?.user?.id;
    const limit = data.limit || 10;
    const cursor = null;

    const onWhatsapp = (await this.whatsappNumber({ numbers: [jid] }))?.shift();

    if (!onWhatsapp.exists) {
      throw new BadRequestException(onWhatsapp);
    }

    try {
      const info = (await this.whatsappNumber({ numbers: [jid] }))?.shift();
      const business = await this.fetchBusinessProfile(info?.jid);

      let catalog = await this.getCatalog({ jid: info?.jid, limit, cursor });
      let nextPageCursor = catalog.nextPageCursor;
      let nextPageCursorJson = nextPageCursor ? JSON.parse(atob(nextPageCursor)) : null;
      let pagination = nextPageCursorJson?.pagination_cursor
        ? JSON.parse(atob(nextPageCursorJson.pagination_cursor))
        : null;
      let fetcherHasMore = pagination?.fetcher_has_more === true ? true : false;

      let productsCatalog = catalog.products || [];
      let countLoops = 0;
      while (fetcherHasMore && countLoops < 4) {
        catalog = await this.getCatalog({ jid: info?.jid, limit, cursor: nextPageCursor });
        nextPageCursor = catalog.nextPageCursor;
        nextPageCursorJson = nextPageCursor ? JSON.parse(atob(nextPageCursor)) : null;
        pagination = nextPageCursorJson?.pagination_cursor
          ? JSON.parse(atob(nextPageCursorJson.pagination_cursor))
          : null;
        fetcherHasMore = pagination?.fetcher_has_more === true ? true : false;
        productsCatalog = [...productsCatalog, ...catalog.products];
        countLoops++;
      }

      return {
        wuid: info?.jid || jid,
        numberExists: info?.exists,
        isBusiness: business.isBusiness,
        catalogLength: productsCatalog.length,
        catalog: productsCatalog,
      };
    } catch (error) {
      console.log(error);
      return { wuid: jid, name: null, isBusiness: false };
    }
  }

  public async getCatalog({
    jid,
    limit,
    cursor,
  }: GetCatalogOptions): Promise<{ products: Product[]; nextPageCursor: string | undefined }> {
    try {
      jid = jid ? createJid(jid) : this.instance.wuid;

      const catalog = await this.client.getCatalog({ jid, limit: limit, cursor: cursor });

      if (!catalog) {
        return { products: undefined, nextPageCursor: undefined };
      }

      return catalog;
    } catch (error) {
      throw new InternalServerErrorException('Error getCatalog', error.toString());
    }
  }

  public async fetchCollections(instanceName: string, data: getCollectionsDto) {
    const jid = data.number ? createJid(data.number) : this.client?.user?.id;
    const limit = data.limit <= 20 ? data.limit : 20; //(tem esse limite, n\u00fco sei porque)

    const onWhatsapp = (await this.whatsappNumber({ numbers: [jid] }))?.shift();

    if (!onWhatsapp.exists) {
      throw new BadRequestException(onWhatsapp);
    }

    try {
      const info = (await this.whatsappNumber({ numbers: [jid] }))?.shift();
      const business = await this.fetchBusinessProfile(info?.jid);
      const collections = await this.getCollections(info?.jid, limit);

      return {
        wuid: info?.jid || jid,
        name: info?.name,
        numberExists: info?.exists,
        isBusiness: business.isBusiness,
        collectionsLength: collections?.length,
        collections: collections,
      };
    } catch {
      return { wuid: jid, name: null, isBusiness: false };
    }
  }

  public async getCollections(jid?: string | undefined, limit?: number): Promise<CatalogCollection[]> {
    try {
      jid = jid ? createJid(jid) : this.instance.wuid;

      const result = await this.client.getCollections(jid, limit);

      if (!result) {
        return [{ id: undefined, name: undefined, products: [], status: undefined }];
      }

      return result.collections;
    } catch (error) {
      throw new InternalServerErrorException('Error getCatalog', error.toString());
    }
  }

  public async fetchMessages(query: Query<Message>) {
    const keyFilters = query?.where?.key as ExtendedIMessageKey;

    const timestampFilter = {};
    if (query?.where?.messageTimestamp) {
      if (query.where.messageTimestamp['gte'] && query.where.messageTimestamp['lte']) {
        timestampFilter['messageTimestamp'] = {
          gte: Math.floor(new Date(query.where.messageTimestamp['gte']).getTime() / 1000),
          lte: Math.floor(new Date(query.where.messageTimestamp['lte']).getTime() / 1000),
        };
      }
    }

    const count = await this.prismaRepository.message.count({
      where: {
        instanceId: this.instanceId,
        id: query?.where?.id,
        source: query?.where?.source,
        messageType: query?.where?.messageType,
        ...timestampFilter,
        AND: [
          keyFilters?.id ? { key: { path: ['id'], equals: keyFilters?.id } } : {},
          keyFilters?.fromMe ? { key: { path: ['fromMe'], equals: keyFilters?.fromMe } } : {},
          keyFilters?.participant ? { key: { path: ['participant'], equals: keyFilters?.participant } } : {},
          {
            OR: [
              keyFilters?.remoteJid ? { key: { path: ['remoteJid'], equals: keyFilters?.remoteJid } } : {},
              keyFilters?.remoteJidAlt ? { key: { path: ['remoteJidAlt'], equals: keyFilters?.remoteJidAlt } } : {},
            ],
          },
        ],
      },
    });

    if (!query?.offset) {
      query.offset = 50;
    }

    if (!query?.page) {
      query.page = 1;
    }

    const messages = await this.prismaRepository.message.findMany({
      where: {
        instanceId: this.instanceId,
        id: query?.where?.id,
        source: query?.where?.source,
        messageType: query?.where?.messageType,
        ...timestampFilter,
        AND: [
          keyFilters?.id ? { key: { path: ['id'], equals: keyFilters?.id } } : {},
          keyFilters?.fromMe ? { key: { path: ['fromMe'], equals: keyFilters?.fromMe } } : {},
          keyFilters?.participant ? { key: { path: ['participant'], equals: keyFilters?.participant } } : {},
          {
            OR: [
              keyFilters?.remoteJid ? { key: { path: ['remoteJid'], equals: keyFilters?.remoteJid } } : {},
              keyFilters?.remoteJidAlt ? { key: { path: ['remoteJidAlt'], equals: keyFilters?.remoteJidAlt } } : {},
            ],
          },
        ],
      },
      orderBy: { messageTimestamp: 'desc' },
      skip: query.offset * (query?.page === 1 ? 0 : (query?.page as number) - 1),
      take: query.offset,
      select: {
        id: true,
        key: true,
        pushName: true,
        messageType: true,
        message: true,
        messageTimestamp: true,
        instanceId: true,
        source: true,
        contextInfo: true,
        MessageUpdate: { select: { status: true } },
      },
    });

    const formattedMessages = messages.map((message) => {
      const messageKey = message.key as { fromMe: boolean; remoteJid: string; id: string; participant?: string };

      if (!message.pushName) {
        if (messageKey.fromMe) {
          message.pushName = 'T\u01e7';
        } else if (message.contextInfo) {
          const contextInfo = message.contextInfo as { participant?: string };
          if (contextInfo.participant) {
            message.pushName = contextInfo.participant.split('@')[0];
          } else if (messageKey.participant) {
            message.pushName = messageKey.participant.split('@')[0];
          }
        }
      }

      return message;
    });

    return {
      messages: {
        total: count,
        pages: Math.ceil(count / query.offset),
        currentPage: query.page,
        records: formattedMessages,
      },
    };
  }
}
