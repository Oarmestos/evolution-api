import { InstanceDto } from '@api/dto/instance.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { CacheService } from '@api/services/cache.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Events } from '@api/types/wa.types';
import { Chatwoot, ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import i18next from '@utils/i18n';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import mimeTypes from 'mime-types';
import path from 'path';
import { Readable } from 'stream';

import { ChatwootContactService } from './chatwoot.contact.service';
import { ChatwootConversationService } from './chatwoot.conversation.service';
import { ChatwootMessageService } from './chatwoot.message.service';

export class ChatwootWebhookService {
  private readonly logger = new Logger('ChatwootWebhookService');

  constructor(
    private readonly waMonitor: WAMonitoringService,
    private readonly configService: ConfigService,
    private readonly prismaRepository: PrismaRepository,
    private readonly cache: CacheService,
    private readonly contactService: ChatwootContactService,
    private readonly conversationService: ChatwootConversationService,
    private readonly messageService: ChatwootMessageService,
  ) {}

  public async receiveWebhook(instance: InstanceDto, body: any) {
    try {
      if (body.event !== 'message_created' || body.message_type !== 'outgoing' || body.private) {
        return;
      }

      const waInstance = this.waMonitor.waInstances[instance.instanceName];
      if (!waInstance) {
        this.logger.error(`Instance ${instance.instanceName} not found for Chatwoot webhook`);
        return;
      }

      const contact = body.conversation?.contact || body.sender;
      const remoteJid = contact?.identifier;

      if (!remoteJid) {
        this.logger.warn('Contact identifier not found in Chatwoot webhook');
        return;
      }

      const content = body.content || '';
      const attachments = body.attachments;

      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const mediaType =
            attachment.file_type === 'image' ? 'image' : attachment.file_type === 'audio' ? 'audio' : 'document';
          const sent = await waInstance.sendMedia(instance, {
            number: remoteJid,
            media: attachment.data_url,
            caption: content,
            mediaType: mediaType as any,
          });

          if (sent?.key?.id) {
            await this.prismaRepository.message.updateMany({
              where: { key: { path: ['id'], equals: sent.key.id }, instanceId: instance.instanceId },
              data: { chatwootMessageId: body.id, chatwootConversationId: body.conversation.id },
            });
          }
        }
      } else if (content) {
        const sent = await waInstance.sendText(instance, {
          number: remoteJid,
          text: content,
        });

        if (sent?.key?.id) {
          // Link Chatwoot message ID with WhatsApp message ID
          const msg = await this.prismaRepository.message.findFirst({
            where: { key: { path: ['id'], equals: sent.key.id }, instanceId: instance.instanceId },
          });

          if (msg) {
            await this.prismaRepository.message.update({
              where: { id: msg.id },
              data: { chatwootMessageId: body.id, chatwootConversationId: body.conversation.id },
            });
          }
        }
      }
    } catch (error) {
      this.logger.error({ message: 'Error in receiveWebhook', error });
    }
  }

  public async processWebhook(instance: InstanceDto, event: string, body: any): Promise<any> {
    try {
      const waInstance = this.waMonitor.waInstances[instance.instanceName];
      if (!waInstance && event !== 'status.instance') return;

      if (event === Events.MESSAGES_UPSERT || event === 'send.message') {
        if (body.message?.protocolMessage || body.message?.senderKeyDistributionMessage) return;

        // Extract ephemeral message if present
        if (body.message?.ephemeralMessage?.message) {
          body.message = { ...body.message.ephemeralMessage.message };
        }

        const bodyMessage = this.getConversationMessage(body.message);
        const quotedId = body.contextInfo?.stanzaId || body.message?.contextInfo?.stanzaId;
        let quotedMsg = null;

        if (quotedId) {
          quotedMsg = await this.prismaRepository.message.findFirst({
            where: {
              key: { path: ['id'], equals: quotedId },
              chatwootMessageId: { not: null },
            },
          });
        }

        const isMedia = this.isMediaMessage(body.message);
        const reactionMessage = this.getReactionMessage(body.message);
        const isInteractiveButton = this.isInteractiveButtonMessage(body.messageType, body.message);

        if (!bodyMessage && !isMedia && !reactionMessage && !isInteractiveButton) return;

        const conversationId = await this.conversationService.createConversation(instance, body);
        if (!conversationId) return;

        const messageType = body.key.fromMe ? 'outgoing' : 'incoming';

        if (isMedia) {
          return await this.handleMediaMessage(instance, conversationId, body, messageType, bodyMessage, quotedMsg);
        }

        if (reactionMessage?.text) {
          return await this.messageService.createMessage(
            instance,
            conversationId,
            reactionMessage.text,
            messageType,
            false,
            [],
            { message: { extendedTextMessage: { contextInfo: { stanzaId: reactionMessage.key.id } } } },
            'WAID:' + body.key.id,
            quotedMsg,
          );
        }

        if (isInteractiveButton) {
          await this.handleInteractiveButton(instance, conversationId, body, messageType, quotedMsg);
          return;
        }

        // Handle regular text message
        let content = bodyMessage;
        if (body.key.remoteJid.includes('@g.us')) {
          content = this.formatGroupMessage(body, bodyMessage);
        }

        return await this.messageService.createMessage(
          instance,
          conversationId,
          content,
          messageType,
          false,
          [],
          body,
          'WAID:' + body.key.id,
          quotedMsg,
        );
      }

      // Handle other events (Delete, Edit, Read, etc.)
      if (event === Events.MESSAGES_DELETE) {
        await this.handleMessageDelete(instance, body);
      }

      if (event === 'messages.edit' || event === 'send.message.update') {
        await this.handleMessageEdit(instance, body);
      }
    } catch (error) {
      this.logger.error({ message: 'Error in processWebhook', error });
    }
  }

  private async handleMediaMessage(
    instance: InstanceDto,
    conversationId: number,
    body: any,
    messageType: any,
    bodyMessage: string,
    quotedMsg: any,
  ) {
    const waInstance = this.waMonitor.waInstances[instance.instanceName];
    const download = await waInstance.getBase64FromMediaMessage({ message: { ...body } });

    const fileName = this.generateFileName(body, download.mimetype);
    const fileData = Buffer.from(download.base64, 'base64');
    const fileStream = this.bufferToStream(fileData);

    let content = bodyMessage;
    if (body.key.remoteJid.includes('@g.us')) {
      content = this.formatGroupMessage(body, bodyMessage);
    }

    return await this.messageService.sendData(
      instance,
      conversationId,
      fileStream,
      fileName,
      messageType,
      content,
      body,
      'WAID:' + body.key.id,
      quotedMsg,
    );
  }

  private formatGroupMessage(body: any, bodyMessage: string) {
    const participantName = body.pushName;
    const rawNum =
      body.key.addressingMode === 'lid' && !body.key.fromMe && body.key.participantAlt
        ? body.key.participantAlt.split('@')[0].split(':')[0]
        : body.key.participant.split('@')[0].split(':')[0];

    const formattedNum = parsePhoneNumberFromString(`+${rawNum}`)?.formatInternational() || rawNum;

    if (!body.key.fromMe) {
      return bodyMessage
        ? `**${formattedNum} - ${participantName}:**\n\n${bodyMessage}`
        : `**${formattedNum} - ${participantName}:**`;
    }
    return bodyMessage || '';
  }

  private async handleMessageDelete(instance: InstanceDto, body: any) {
    if (!this.configService.get<Chatwoot>('CHATWOOT').MESSAGE_DELETE) return;
    const messageId = body.key?.id;
    if (!messageId) return;

    const message = await this.prismaRepository.message.findFirst({
      where: { key: { path: ['id'], equals: messageId }, instanceId: instance.instanceId },
    });

    if (message?.chatwootMessageId && message?.chatwootConversationId) {
      await this.messageService.deleteMessage(instance, message.chatwootConversationId, message.chatwootMessageId);
      await this.prismaRepository.message.deleteMany({
        where: { key: { path: ['id'], equals: messageId }, instanceId: instance.instanceId },
      });
    }
  }

  private async handleMessageEdit(instance: InstanceDto, body: any) {
    const editedText =
      body?.editedMessage?.conversation ||
      body?.editedMessage?.extendedTextMessage?.text ||
      (typeof body?.text === 'string' ? body.text : '');

    if (!editedText.trim()) return;

    const message = await this.prismaRepository.message.findFirst({
      where: { key: { path: ['id'], equals: body.key?.id }, instanceId: instance.instanceId },
    });

    if (message?.chatwootConversationId && message?.chatwootMessageId) {
      const content = `\n\n\`${i18next.t('cw.message.edited')}:\`\n\n${editedText}`;
      const type = message.key['fromMe'] ? 'outgoing' : 'incoming';
      await this.messageService.createMessage(
        instance,
        message.chatwootConversationId,
        content,
        type,
        false,
        [],
        { message: { extendedTextMessage: { contextInfo: { stanzaId: body.key.id } } } },
        'WAID:' + body.key.id,
        null,
      );
    }
  }

  private async handleInteractiveButton(
    instance: InstanceDto,
    conversationId: number,
    body: any,
    messageType: any,
    quotedMsg: any,
  ) {
    // Legacy PIX logic (Brazil) - Kept but noted for Colombia
    const buttons = body.message.interactiveMessage?.nativeFlowMessage?.buttons || [];
    for (const button of buttons) {
      const params = JSON.parse(button.buttonParamsJson);
      if (button.name === 'payment_info' && params.payment_settings?.[0]?.type === 'pix_static_code') {
        const pix = params.payment_settings[0].pix_static_code;
        const content = `*${pix.merchant_name}*\nChave PIX: ${pix.key}`;
        await this.messageService.createMessage(
          instance,
          conversationId,
          content,
          messageType,
          false,
          [],
          body,
          'WAID:' + body.key.id,
          quotedMsg,
        );
      }
    }
  }

  // Helper methods
  public getConversationMessage(message: any): string {
    if (!message) return '';
    return (
      message.conversation ||
      message.extendedTextMessage?.text ||
      message.imageMessage?.caption ||
      message.videoMessage?.caption ||
      ''
    );
  }

  private isMediaMessage(message: any): boolean {
    return !!(
      message?.imageMessage ||
      message?.videoMessage ||
      message?.audioMessage ||
      message?.documentMessage ||
      message?.stickerMessage
    );
  }

  private getReactionMessage(message: any) {
    if (message?.reactionMessage) {
      return { text: `Reagiu com: ${message.reactionMessage.text}`, key: message.reactionMessage.key };
    }
    return null;
  }

  private isInteractiveButtonMessage(type: string, message: any): boolean {
    return type === 'interactiveMessage' && !!message?.interactiveMessage?.nativeFlowMessage;
  }

  private generateFileName(body: any, mimetype: string): string {
    const msgBody = body?.message[body?.messageType];
    const original = msgBody?.fileName || msgBody?.filename;
    if (original) {
      const p = path.parse(original);
      return `${p.name}-${Math.floor(Math.random() * 90 + 10)}${p.ext}`;
    }
    return `${Math.random().toString(36).substring(7)}.${mimeTypes.extension(mimetype) || 'bin'}`;
  }

  private bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream._read = () => {};
    stream.push(buffer);
    stream.push(null);
    return stream;
  }
}
