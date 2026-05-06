import { InstanceDto } from '@api/dto/instance.dto';
import { ChatwootDto } from '@api/integrations/chatbot/chatwoot/dto/chatwoot.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { CacheService } from '@api/services/cache.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Chatwoot, ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { inbox } from '@figuro/chatwoot-sdk';
import { Contact as ContactModel, Message as MessageModel } from '@prisma/client';

import { chatwootImport } from '../utils/chatwoot-import-helper';
import { ChatwootContactService } from './chatwoot.contact.service';
import { ChatwootConversationService } from './chatwoot.conversation.service';
import { ChatwootMessageService } from './chatwoot.message.service';
import { ChatwootWebhookService } from './chatwoot.webhook.service';

export class ChatwootService {
  private readonly logger = new Logger('ChatwootService');
  private readonly contactService: ChatwootContactService;
  private readonly conversationService: ChatwootConversationService;
  private readonly messageService: ChatwootMessageService;
  private readonly webhookService: ChatwootWebhookService;

  constructor(
    private readonly waMonitor: WAMonitoringService,
    private readonly configService: ConfigService,
    private readonly prismaRepository: PrismaRepository,
    private readonly cache: CacheService,
  ) {
    this.contactService = new ChatwootContactService(waMonitor, configService, cache);
    this.conversationService = new ChatwootConversationService(waMonitor, configService, cache, this.contactService);
    this.messageService = new ChatwootMessageService(
      waMonitor,
      configService,
      cache,
      this.contactService,
      this.conversationService,
    );
    this.webhookService = new ChatwootWebhookService(
      waMonitor,
      configService,
      prismaRepository,
      cache,
      this.contactService,
      this.conversationService,
      this.messageService,
    );
  }

  public async processWebhook(instance: InstanceDto, event: string, body: any) {
    return this.webhookService.processWebhook(instance, event, body);
  }

  public async receiveWebhook(instance: InstanceDto, body: any) {
    return this.webhookService.receiveWebhook(instance, body);
  }

  public async eventWhatsapp(event: string, instance: InstanceDto, body: any) {
    return this.webhookService.processWebhook(instance, event, body);
  }

  public async create(instance: InstanceDto, data: ChatwootDto) {
    return await this.prismaRepository.chatwoot.upsert({
      where: { instanceId: instance.instanceId },
      update: data,
      create: { ...data, instanceId: instance.instanceId },
    });
  }

  public async find(instance: InstanceDto) {
    return await this.prismaRepository.chatwoot.findUnique({
      where: { instanceId: instance.instanceId },
    });
  }

  public getConversationMessage(message: any) {
    return this.webhookService.getConversationMessage(message);
  }

  public getCache() {
    return this.cache;
  }

  public async createConversation(instance: InstanceDto, body: any) {
    return this.conversationService.createConversation(instance, body);
  }

  public async getInbox(instance: InstanceDto): Promise<inbox | null> {
    return this.conversationService.getInbox(instance);
  }

  public async createMessage(
    instance: InstanceDto,
    conversationId: number,
    content: string,
    messageType: 'incoming' | 'outgoing' | undefined,
    privateMessage?: boolean,
    attachments?: any[],
    messageBody?: any,
    sourceId?: string,
    quotedMsg?: MessageModel,
  ) {
    return this.messageService.createMessage(
      instance,
      conversationId,
      content,
      messageType,
      privateMessage,
      attachments,
      messageBody,
      sourceId,
      quotedMsg,
    );
  }

  public async createBotMessage(
    instance: InstanceDto,
    content: string,
    messageType: 'incoming' | 'outgoing' | undefined,
  ) {
    const inbox = await this.getInbox(instance);
    if (!inbox) return null;
    const contact = await this.contactService.findContact(instance, 'bot');
    if (!contact) return null;
    const conversation = await this.conversationService.getOpenConversationByContact(instance, inbox, contact);
    if (!conversation) return null;
    return this.messageService.createMessage(instance, conversation.id, content, messageType, false);
  }

  public normalizeJidIdentifier(remoteJid: string) {
    if (!remoteJid) return '';
    if (remoteJid.includes('@lid')) return remoteJid;
    return remoteJid.replace(/:\d+/, '').split('@')[0];
  }

  public isImportHistoryAvailable() {
    const uri = this.configService.get<Chatwoot>('CHATWOOT').IMPORT.DATABASE.CONNECTION.URI;
    return uri && uri !== 'postgres://user:password@hostname:port/dbname';
  }

  public addHistoryMessages(instance: InstanceDto, messagesRaw: MessageModel[]) {
    if (this.isImportHistoryAvailable()) chatwootImport.addHistoryMessages(instance, messagesRaw);
  }

  public addHistoryContacts(instance: InstanceDto, contactsRaw: ContactModel[]) {
    if (this.isImportHistoryAvailable()) return chatwootImport.addHistoryContacts(instance, contactsRaw);
  }

  public async importHistoryMessages(instance: InstanceDto) {
    if (!this.isImportHistoryAvailable()) return;
    const inbox = await this.getInbox(instance);
    const provider = await this.waMonitor.waInstances[instance.instanceName]?.findChatwoot();
    return chatwootImport.importHistoryMessages(instance, this as any, inbox, provider);
  }
}
