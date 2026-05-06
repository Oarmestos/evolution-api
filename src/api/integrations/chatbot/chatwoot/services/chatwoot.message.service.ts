import { InstanceDto } from '@api/dto/instance.dto';
import { CacheService } from '@api/services/cache.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import ChatwootClient from '@figuro/chatwoot-sdk';
import { Chatwoot as ChatwootModel, Message as MessageModel } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

import { chatwootImport } from '../utils/chatwoot-import-helper';
import { ChatwootContactService } from './chatwoot.contact.service';
import { ChatwootConversationService } from './chatwoot.conversation.service';

export class ChatwootMessageService {
  private readonly logger = new Logger('ChatwootMessageService');

  constructor(
    private readonly waMonitor: WAMonitoringService,
    private readonly configService: ConfigService,
    private readonly cache: CacheService,
    private readonly contactService: ChatwootContactService,
    private readonly conversationService: ChatwootConversationService,
  ) {}

  private async getProvider(instance: InstanceDto): Promise<ChatwootModel | null> {
    const cacheKey = `${instance.instanceName}:getProvider`;
    if (await this.cache.has(cacheKey)) {
      return (await this.cache.get(cacheKey)) as ChatwootModel;
    }

    const provider = await this.waMonitor.waInstances[instance.instanceName]?.findChatwoot();
    if (!provider) return null;

    this.cache.set(cacheKey, provider);
    return provider;
  }

  private async clientCw(instance: InstanceDto) {
    const config = await this.contactService.getClientCwConfig(instance);
    if (!config) return null;
    return new ChatwootClient({ config });
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
    const client = await this.clientCw(instance);
    const provider = await this.getProvider(instance);
    if (!client || !provider) return null;

    const replyToIds = await this.getReplyToIds(messageBody);
    const sourceReplyId = quotedMsg?.chatwootMessageId || null;

    try {
      return await client.messages.create({
        accountId: Number(provider.accountId),
        conversationId,
        data: {
          content,
          message_type: messageType,
          attachments,
          private: privateMessage || false,
          source_id: sourceId,
          content_attributes: { ...replyToIds },
          source_reply_id: sourceReplyId ? sourceReplyId.toString() : null,
        },
      });
    } catch (error) {
      this.logger.error({ message: 'Error creating message', error });
      return null;
    }
  }

  public async sendData(
    instance: InstanceDto,
    conversationId: number,
    fileStream: Readable,
    fileName: string,
    messageType: 'incoming' | 'outgoing' | undefined,
    content?: string,
    messageBody?: any,
    sourceId?: string,
    quotedMsg?: MessageModel,
  ) {
    const provider = await this.getProvider(instance);
    const config = await this.contactService.getClientCwConfig(instance);
    if (!provider || !config) return null;

    if (sourceId && chatwootImport.getExistingSourceIds) {
      const messageAlreadySaved = await chatwootImport.getExistingSourceIds([sourceId], conversationId);
      if (messageAlreadySaved && messageAlreadySaved.size > 0) {
        this.logger.warn('Message already saved on chatwoot');
        return null;
      }
    }

    const data = new FormData();
    if (content) data.append('content', content);
    data.append('message_type', messageType);
    data.append('attachments[]', fileStream, { filename: fileName });

    const sourceReplyId = quotedMsg?.chatwootMessageId || null;
    if (messageBody) {
      const replyToIds = await this.getReplyToIds(messageBody);
      if (replyToIds.in_reply_to || replyToIds.in_reply_to_external_id) {
        data.append('content_attributes', JSON.stringify(replyToIds));
      }
    }

    if (sourceReplyId) data.append('source_reply_id', sourceReplyId.toString());
    if (sourceId) data.append('source_id', sourceId);

    try {
      const response = await axios.post(
        `${config.basePath}/api/v1/accounts/${provider.accountId}/conversations/${conversationId}/messages`,
        data,
        {
          headers: {
            ...data.getHeaders(),
            api_access_token: config.token as any,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error({ message: 'Error sending media message', error });
      return null;
    }
  }

  public async getReplyToIds(message: any) {
    const replyToIds: any = {};
    const quotedMessage =
      message?.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      message?.message?.imageMessage?.contextInfo?.quotedMessage ||
      message?.message?.videoMessage?.contextInfo?.quotedMessage;

    if (quotedMessage) {
      const stanzaId =
        message.message.extendedTextMessage?.contextInfo?.stanzaId ||
        message.message.imageMessage?.contextInfo?.stanzaId ||
        message.message.videoMessage?.contextInfo?.stanzaId;

      if (stanzaId) {
        replyToIds['in_reply_to_external_id'] = stanzaId;
        // Logic to find internal ID if available in DB could go here
      }
    }
    return replyToIds;
  }

  public async deleteMessage(instance: InstanceDto, conversationId: number, messageId: number) {
    const client = await this.clientCw(instance);
    const provider = await this.getProvider(instance);
    if (!client || !provider) return null;

    try {
      return await client.messages.delete({
        accountId: Number(provider.accountId),
        conversationId,
        messageId,
      });
    } catch {
      return null;
    }
  }
}
