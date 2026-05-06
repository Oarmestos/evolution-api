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
import { BaileysBusinessService } from './services/baileys.business.service';
import { BaileysChatService } from './services/baileys.chat.service';
import { BaileysConnectionService } from './services/baileys.connection.service';
import { BaileysContactService } from './services/baileys.contact.service';
import { BaileysEventHandler } from './services/baileys.event.handler';
import { BaileysGroupService } from './services/baileys.group.service';
import { BaileysMessageService } from './services/baileys.message.service';
import { ExtendedIMessageKey, groupMetadataCache } from './utils/baileys.utils';
import { useVoiceCallsBaileys } from './voiceCalls/useVoiceCallsBaileys';

export class BaileysStartupService extends ChannelStartupService {
  private messageProcessor = new BaileysMessageProcessor();
  private readonly messageService: BaileysMessageService;
  private readonly groupService: BaileysGroupService;
  private readonly contactService: BaileysContactService;
  private readonly chatService: BaileysChatService;
  private readonly businessService: BaileysBusinessService;
  private readonly connectionService: BaileysConnectionService;
  public readonly eventHandlerService: BaileysEventHandler;

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
    this.messageService = new BaileysMessageService(this.prismaRepository, this.configService);
    this.groupService = new BaileysGroupService(this.prismaRepository, this.configService);
    this.contactService = new BaileysContactService(this.prismaRepository, this.configService);
    this.chatService = new BaileysChatService(this.prismaRepository, this.configService);
    this.businessService = new BaileysBusinessService(this.prismaRepository, this.configService);
    this.connectionService = new BaileysConnectionService(this.prismaRepository, this.configService, this.cache);
    this.eventHandlerService = new BaileysEventHandler(this);

    this.instance.qrcode = { count: 0 };
    if (this.eventHandlerService?.messageHandle?.['messages.upsert']) {
      this.messageProcessor.mount({
        onMessageReceive: this.eventHandlerService.messageHandle['messages.upsert'].bind(this.eventHandlerService),
      });
    }

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

  public async connectionUpdate(update: Partial<ConnectionState>) {
    return await this.connectionService.connectionUpdate(this, update);
  }

  public async defineAuthState() {
    return await this.connectionService.defineAuthState(this);
  }

  public async createClient(number?: string): Promise<WASocket> {
    return await this.connectionService.createClient(this, number);
  }

  public async connectToWhatsapp(number?: string): Promise<WASocket> {
    return await this.connectionService.connectToWhatsapp(this, number);
  }

  public async reloadConnection(): Promise<WASocket> {
    return await this.connectionService.reloadConnection(this);
  }

  public async eventHandler() {
    return await this.eventHandlerService.bindEvents();
  }

  public async findChatByRemoteJid(remoteJid: string) {
    return await this.chatService.findChatByRemoteJid(this, remoteJid);
  }

  public async fetchInternalNotes(remoteJid: string) {
    return await this.chatService.fetchInternalNotes(this, remoteJid);
  }

  public async createInternalNote(remoteJid: string, content: string, userId: string) {
    return await this.chatService.createInternalNote(this, remoteJid, content, userId);
  }

  public async updateControlMode(remoteJid: string, mode: 'AI' | 'HUMAN') {
    return await this.chatService.updateControlMode(this, remoteJid, mode);
  }

  public async updateContact(remoteJid: string, data: { pushName?: string; phoneNumber?: string; email?: string }) {
    return await this.contactService.updateContact(this, remoteJid, data);
  }

  public async muteChat(data: MuteChatDto) {
    return await this.chatService.muteChat(this, data);
  }

  public async deleteChat(remoteJid: string) {
    return await this.chatService.deleteChat(this, remoteJid);
  }

  public async deleteMessage(del: DeleteMessage) {
    return await this.chatService.deleteMessage(this, del);
  }

  public async markMessageAsRead(data: ReadMessageDto) {
    return await this.chatService.markMessageAsRead(this, data);
  }

  public async archiveChat(data: ArchiveChatDto) {
    return await this.chatService.archiveChat(this, data);
  }

  public async markChatUnread(data: MarkChatUnreadDto) {
    return await this.chatService.markChatUnread(this, data);
  }

  public async blockUser(data: BlockUserDto) {
    return await this.contactService.blockUser(this, data);
  }

  public async fetchContacts(query: Query<PrismaContact>) {
    return await this.chatService.fetchContacts(this, query);
  }

  public async fetchChats(query: Query<PrismaContact>) {
    return await this.chatService.fetchChats(this, query);
  }

  public async fetchStatusMessage(query: Query<MessageUpdate>) {
    return await this.chatService.fetchStatusMessage(this, query);
  }

  public async fetchPrivacySettings() {
    return await this.contactService.fetchPrivacySettings(this);
  }

  public async updatePrivacySettings(data: PrivacySettingDto) {
    return await this.contactService.updatePrivacySettings(this, data);
  }

  public async updateProfileName(name: string) {
    return await this.contactService.updateProfileName(this, name);
  }

  public async updateProfileStatus(status: string) {
    return await this.contactService.updateProfileStatus(this, status);
  }

  public async updateProfilePicture(picture: string) {
    return await this.contactService.updateProfilePicture(this, picture);
  }

  public async removeProfilePicture() {
    return await this.contactService.removeProfilePicture(this);
  }

  public async updateMessage(data: UpdateMessageDto) {
    return await this.chatService.updateMessage(this, data);
  }

  // Restored Message Methods
  public async textMessage(data: SendTextDto, isIntegration = false) {
    return await this.messageService.textMessage(this, data, isIntegration);
  }

  public async mediaMessage(data: SendMediaDto, file?: any, isIntegration = false) {
    return await this.messageService.mediaMessage(this, data, file, isIntegration);
  }

  public async audioWhatsapp(data: SendAudioDto, file?: any, isIntegration = false) {
    return await this.messageService.audioWhatsapp(this, data, file, isIntegration);
  }

  public async stickerMessage(data: SendMediaDto, file?: any, isIntegration = false) {
    return await this.messageService.stickerMessage(this, data, file, isIntegration);
  }

  public async ptvMessage(data: SendMediaDto, file?: any, isIntegration = false) {
    return await this.messageService.ptvMessage(this, data, file, isIntegration);
  }

  public async pollMessage(data: SendPollDto) {
    return await this.messageService.pollMessage(this, data);
  }

  public async reactionMessage(data: SendReactionDto) {
    return await this.messageService.reactionMessage(this, data);
  }

  public async contactMessage(data: SendContactDto) {
    return await this.messageService.contactMessage(this, data);
  }

  public async locationMessage(data: SendLocationDto) {
    return await this.messageService.locationMessage(this, data);
  }

  public async listMessage(data: SendListDto) {
    return await this.messageService.listMessage(this, data);
  }

  public async getBase64FromMediaMessage(data: getBase64FromMediaMessageDto, getBuffer = false) {
    return await this.messageService['getBase64FromMediaMessage'](data, getBuffer); // Assuming it's in messageService
  }

  // Restored Group Methods
  public async createGroup(create: CreateGroupDto) {
    return await this.groupService.createGroup(this, create);
  }

  public async updateGroupPicture(picture: GroupPictureDto) {
    return await this.groupService.updateGroupPicture(this, picture);
  }

  public async updateGroupSubject(data: GroupSubjectDto) {
    return await this.groupService.updateGroupSubject(this, data);
  }

  public async updateGroupDescription(data: GroupDescriptionDto) {
    return await this.groupService.updateGroupDescription(this, data);
  }

  public async findGroup(id: GroupJid, reply: 'inner' | 'out' = 'out') {
    return await this.groupService.findGroup(this, id, reply);
  }

  public async fetchAllGroups(getParticipants: GetParticipant) {
    return await this.groupService.fetchAllGroups(this, getParticipants);
  }

  public async inviteCode(id: GroupJid) {
    return await this.groupService.inviteCode(this, id);
  }

  public async inviteInfo(id: GroupInvite) {
    return await this.groupService.inviteInfo(this, id);
  }

  public async sendInvite(id: GroupSendInvite) {
    return await this.groupService.sendInvite(this, id);
  }

  public async acceptInviteCode(id: AcceptGroupInvite) {
    return await this.groupService.acceptInviteCode(this, id);
  }

  public async revokeInviteCode(id: GroupJid) {
    return await this.groupService.revokeInviteCode(this, id);
  }

  public async findParticipants(id: GroupJid) {
    return await this.groupService.findParticipants(this, id);
  }

  public async updateGParticipant(update: GroupUpdateParticipantDto) {
    return await this.groupService.updateGParticipant(this, update);
  }

  public async updateGSetting(update: GroupUpdateSettingDto) {
    return await this.groupService.updateGSetting(this, update);
  }

  public async toggleEphemeral(update: GroupToggleEphemeralDto) {
    return await this.groupService.toggleEphemeral(this, update);
  }

  public async leaveGroup(id: GroupJid) {
    return await this.groupService.leaveGroup(this, id);
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

  public async fetchBusinessProfile(jid?: string) {
    try {
      jid = jid ? createJid(jid) : this.instance.wuid;
      const business = await this.client.getBusinessProfile(jid);
      if (!business) return { isBusiness: false };
      return { isBusiness: true, ...business };
    } catch (error) {
      throw new InternalServerErrorException('Error fetchBusinessProfile', error.toString());
    }
  }

  public async profilePicture(jid?: string) {
    return await this.contactService.profilePicture(this, jid || this.instance.wuid);
  }

  public async fetchProfile(instanceName: string, number: string) {
    return await this.contactService.fetchProfile(this, number);
  }

  public async whatsappNumber(data: WhatsAppNumberDto) {
    return await this.contactService.whatsappNumber(this, data);
  }

  // Business Methods
  public async fetchCatalog(instanceName: string, data: any) {
    return await this.businessService.fetchCatalog(this, data);
  }

  public async getCatalog(options: any) {
    return await this.businessService.getCatalog(this, options);
  }

  public async fetchCollections(instanceName: string, data: any) {
    return await this.businessService.fetchCollections(this, data);
  }

  public async getCollections(jid?: string, limit?: number) {
    return await this.businessService.getCollections(this, jid, limit);
  }

  public async fetchMessages(query: Query<Message>) {
    return await this.chatService.fetchMessages(this, query);
  }
}
