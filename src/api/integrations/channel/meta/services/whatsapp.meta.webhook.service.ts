import { ChatwootService } from '@api/integrations/chatbot/chatwoot/services/chatwoot.service';
import { OpenaiService } from '@api/integrations/chatbot/openai/services/openai.service';
import * as s3Service from '@api/integrations/storage/s3/libs/minio.server';
import { PrismaRepository } from '@api/repository/repository.service';
import { chatbotController } from '@api/server.module';
import { Events, wa } from '@api/types/wa.types';
import { Chatwoot, ConfigService, Database, Openai, S3, WaBusiness } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { createJid } from '@utils/createJid';
import { status } from '@utils/renderStatus';
import { sendTelemetry } from '@utils/sendTelemetry';
import axios from 'axios';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { join } from 'path';

import { MetaMediaService } from './whatsapp.meta.media.service';

export class MetaWebhookService {
  private readonly logger = new Logger('MetaWebhookService');

  constructor(
    private readonly instance: wa.Instance,
    private readonly configService: ConfigService,
    private readonly prismaRepository: PrismaRepository,
    private readonly chatwootService: ChatwootService,
    private readonly openaiService: OpenaiService,
    private readonly mediaService: MetaMediaService,
    private readonly localSettings: wa.LocalSettings,
    private readonly localChatwoot: wa.LocalChatwoot,
    private readonly localWebhook: wa.LocalWebHook,
    private readonly sendDataWebhook: (event: string, data: any) => void,
  ) {}

  private get instanceId() {
    return this.instance.id;
  }

  private get token() {
    return this.instance.token;
  }

  public async eventHandler(content: any) {
    try {
      this.logger.log('Contenido recibido en eventHandler:');
      this.logger.log(JSON.stringify(content, null, 2));

      const database = this.configService.get<Database>('DATABASE');
      const settings = await this.findSettings();

      if (content.messages && content.messages.length > 0) {
        const message = content.messages[0];
        const validTypes = [
          'text',
          'image',
          'video',
          'audio',
          'document',
          'sticker',
          'location',
          'contacts',
          'interactive',
          'button',
          'reaction',
        ];

        if (validTypes.includes(message.type)) {
          await this.messageHandle(content, database, settings);
        } else {
          this.logger.warn(`Tipo de mensaje no reconocido: ${message.type}`);
        }
      } else if (content.statuses) {
        await this.messageHandle(content, database, settings);
      }
    } catch (error) {
      this.logger.error({ message: 'Error en eventHandler:', error });
    }
  }

  private async findSettings() {
    return await this.prismaRepository.setting.findFirst({
      where: { instanceId: this.instanceId },
    });
  }

  public async messageHandle(received: any, database: Database, settings: any) {
    try {
      let messageRaw: any;
      let pushName: any;

      if (received.contacts) pushName = received.contacts[0].profile.name;

      if (received.messages) {
        const message = received.messages[0];
        let waPhoneNumber = message.from;
        if (received.contacts && received.contacts[0]?.wa_id) {
          waPhoneNumber = received.contacts[0].wa_id;
        }

        const key = {
          id: message.id,
          remoteJid: message.from,
          fromMe: message.from === received.metadata.phone_number_id,
        };

        if (message.type === 'sticker') {
          messageRaw = {
            key,
            pushName,
            message: { stickerMessage: message.sticker || {} },
            messageType: 'stickerMessage',
            messageTimestamp: parseInt(message.timestamp),
            source: 'unknown',
            instanceId: this.instanceId,
          };
        } else if (this.isMediaMessage(message)) {
          const messageContent =
            message.type === 'audio' ? this.messageAudioJson(received) : this.messageMediaJson(received);

          messageRaw = {
            key,
            pushName,
            message: messageContent,
            contextInfo: messageContent?.contextInfo,
            messageType: this.renderMessageType(received.messages[0].type),
            messageTimestamp: parseInt(received.messages[0].timestamp),
            source: 'unknown',
            instanceId: this.instanceId,
          };

          if (this.configService.get<S3>('S3').ENABLE) {
            await this.handleS3Media(received, messageRaw, key);
          } else if (this.localWebhook.enabled && this.localWebhook.webhookBase64) {
            const buffer = await this.mediaService.downloadMediaMessage(received?.messages[0]);
            messageRaw.message.base64 = buffer.toString('base64');
          }

          // Speech to text if audio and enabled
          if (this.configService.get<Openai>('OPENAI').ENABLED && message.type === 'audio') {
            await this.handleAudioTranscription(received, messageRaw);
          }
        } else if (received?.messages[0].interactive) {
          messageRaw = {
            key,
            pushName,
            message: this.messageInteractiveJson(received),
            contextInfo: this.messageInteractiveJson(received)?.contextInfo,
            messageType: 'interactiveMessage',
            messageTimestamp: parseInt(received.messages[0].timestamp),
            source: 'unknown',
            instanceId: this.instanceId,
          };
        } else if (received?.messages[0].button) {
          messageRaw = {
            key,
            pushName,
            message: this.messageButtonJson(received),
            contextInfo: this.messageButtonJson(received)?.contextInfo,
            messageType: 'buttonMessage',
            messageTimestamp: parseInt(received.messages[0].timestamp),
            source: 'unknown',
            instanceId: this.instanceId,
          };
        } else if (received?.messages[0].reaction) {
          messageRaw = {
            key,
            pushName,
            message: this.messageReactionJson(received),
            contextInfo: this.messageReactionJson(received)?.contextInfo,
            messageType: 'reactionMessage',
            messageTimestamp: parseInt(received.messages[0].timestamp),
            source: 'unknown',
            instanceId: this.instanceId,
          };
        } else if (received?.messages[0].contacts) {
          messageRaw = {
            key,
            pushName,
            message: this.messageContactsJson(received),
            contextInfo: this.messageContactsJson(received)?.contextInfo,
            messageType: 'contactMessage',
            messageTimestamp: parseInt(received.messages[0].timestamp),
            source: 'unknown',
            instanceId: this.instanceId,
          };
        } else {
          messageRaw = {
            key,
            pushName,
            message: this.messageTextJson(received),
            contextInfo: this.messageTextJson(received)?.contextInfo,
            messageType: this.renderMessageType(received.messages[0].type),
            messageTimestamp: parseInt(received.messages[0].timestamp),
            source: 'unknown',
            instanceId: this.instanceId,
          };
        }

        sendTelemetry(`received.message.${messageRaw.messageType ?? 'unknown'}`);
        this.sendDataWebhook(Events.MESSAGES_UPSERT, messageRaw);

        await chatbotController.emit({
          instance: { instanceName: this.instance.name, instanceId: this.instanceId },
          remoteJid: messageRaw.key.remoteJid,
          msg: messageRaw,
          pushName: messageRaw.pushName,
        });

        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
          const chatwootSentMessage = await this.chatwootService.eventWhatsapp(
            Events.MESSAGES_UPSERT,
            { instanceName: this.instance.name, instanceId: this.instanceId },
            messageRaw,
          );

          if (chatwootSentMessage?.id) {
            messageRaw.chatwootMessageId = chatwootSentMessage.id;
            messageRaw.chatwootInboxId = chatwootSentMessage.id;
            messageRaw.chatwootConversationId = chatwootSentMessage.id;
          }
        }

        if (!this.isMediaMessage(message) && message.type !== 'sticker') {
          await this.prismaRepository.message.create({ data: messageRaw });
        }

        await this.handleContactSync(key, pushName, waPhoneNumber);
      }

      if (received.statuses) {
        await this.handleStatuses(received, settings);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async handleS3Media(received: any, messageRaw: any, key: any) {
    try {
      if (!this.mediaService.hasValidMediaContent(messageRaw)) {
        this.logger.warn('Message detected as media but contains no valid media content');
        return;
      }

      const id = received.messages[0][received.messages[0].type].id;
      let urlServer = this.configService.get<WaBusiness>('WA_BUSINESS').URL;
      const version = this.configService.get<WaBusiness>('WA_BUSINESS').VERSION;
      urlServer = `${urlServer}/${version}/${id}`;
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
      const result = await axios.get(urlServer, { headers });

      const buffer = await axios.get(result.data.url, {
        headers: { Authorization: `Bearer ${this.token}` },
        responseType: 'arraybuffer',
      });

      const mediaType = received.messages[0].type;
      if (mediaType === 'video' && !this.configService.get<S3>('S3').SAVE_VIDEO) return;

      const mimetype = result.data?.mime_type || result.headers['content-type'];
      const contentDisposition = result.headers['content-disposition'];
      let fileName = `${received.messages[0].id}.${mimetype.split('/')[1]}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match) fileName = match[1];
      }

      const fullName = join(`${this.instance.id}`, key.remoteJid, mediaType, fileName);
      await s3Service.uploadFile(fullName, buffer.data, buffer.data.byteLength, { 'Content-Type': mimetype });

      const createdMessage = await this.prismaRepository.message.create({ data: messageRaw });
      await this.prismaRepository.media.create({
        data: {
          messageId: createdMessage.id,
          instanceId: this.instanceId,
          type: mediaType,
          fileName: fullName,
          mimetype,
        },
      });

      messageRaw.message.mediaUrl = await s3Service.getObjectUrl(fullName);
      if (this.localWebhook.enabled && this.localWebhook.webhookBase64) {
        messageRaw.message.base64 = buffer.data.toString('base64');
      }
    } catch (error) {
      this.logger.error(['Error on upload file to minio', error?.message]);
    }
  }

  private async handleAudioTranscription(received: any, messageRaw: any) {
    const openAiSettings = await this.prismaRepository.openaiSetting.findFirst({
      where: { instanceId: this.instanceId },
      include: { OpenaiCreds: true },
    });

    if (openAiSettings?.OpenaiCreds && openAiSettings.speechToText) {
      try {
        const audioData: any = {};
        if (messageRaw.message.mediaUrl) audioData.mediaUrl = messageRaw.message.mediaUrl;
        else {
          const buffer = await this.mediaService.downloadMediaMessage(received?.messages[0]);
          audioData.base64 = buffer.toString('base64');
        }

        messageRaw.message.speechToText = `[audio] ${await this.openaiService.speechToText(openAiSettings.OpenaiCreds, {
          message: { ...audioData, ...messageRaw },
        })}`;
      } catch (e) {
        this.logger.error(`Error processing speech-to-text: ${e}`);
      }
    }
  }

  private async handleContactSync(key: any, pushName: string, waPhoneNumber: string) {
    const remoteJid = key.remoteJid;
    if (remoteJid === 'status@broadcast') return;

    const phoneNumber = waPhoneNumber || remoteJid.split('@')[0];
    const contactRaw: any = { remoteJid, pushName, phoneNumber, instanceId: this.instanceId };

    const contact = await this.prismaRepository.contact.findFirst({
      where: { remoteJid, instanceId: this.instanceId },
    });

    if (contact) {
      this.sendDataWebhook(Events.CONTACTS_UPDATE, contactRaw);
      if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
        await this.chatwootService.eventWhatsapp(
          Events.CONTACTS_UPDATE,
          { instanceName: this.instance.name, instanceId: this.instanceId },
          contactRaw,
        );
      }
      await this.prismaRepository.contact.update({ where: { id: contact.id }, data: contactRaw });
    } else {
      this.sendDataWebhook(Events.CONTACTS_UPSERT, contactRaw);
      await this.prismaRepository.contact.create({ data: contactRaw });
    }
  }

  private async handleStatuses(received: any, settings: any) {
    for await (const item of received.statuses) {
      const key = { id: item.id, remoteJid: received.metadata.display_phone_number, fromMe: true };

      if (settings?.groups_ignore && key.remoteJid.includes('@g.us')) continue;
      if (key.remoteJid === 'status@broadcast' || key?.remoteJid?.match(/(:\d+)/)) continue;

      const findMessage = await this.prismaRepository.message.findFirst({
        where: { instanceId: this.instanceId, key: { path: ['id'], equals: key.id } },
      });

      if (!findMessage) continue;

      if (item.message === null && item.status === undefined) {
        this.sendDataWebhook(Events.MESSAGES_DELETE, key);
        await this.prismaRepository.messageUpdate.create({
          data: {
            messageId: findMessage.id,
            keyId: key.id,
            remoteJid: key.remoteJid,
            fromMe: key.fromMe,
            participant: key.remoteJid,
            status: 'DELETED',
            instanceId: this.instanceId,
          },
        });
        if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
          this.chatwootService.eventWhatsapp(
            Events.MESSAGES_DELETE,
            { instanceName: this.instance.name, instanceId: this.instanceId },
            { key },
          );
        }
      } else {
        const messageUpdate = {
          messageId: findMessage.id,
          keyId: key.id,
          remoteJid: key.remoteJid,
          fromMe: key.fromMe,
          participant: key.remoteJid,
          status: item.status.toUpperCase(),
          instanceId: this.instanceId,
        };
        this.sendDataWebhook(Events.MESSAGES_UPDATE, messageUpdate);
        await this.prismaRepository.messageUpdate.create({ data: messageUpdate });
        if (findMessage.webhookUrl) await axios.post(findMessage.webhookUrl as string, messageUpdate);
      }
    }
  }

  // JSON Converters
  private messageMediaJson(received: any) {
    const message = received.messages[0];
    const content: any = { [message.type + 'Message']: message[message.type] };
    if (message.context) content.contextInfo = { stanzaId: message.context.id };
    return content;
  }

  private messageAudioJson(received: any) {
    const message = received.messages[0];
    const content: any = { audioMessage: { ...message.audio, ptt: message.audio.voice || false } };
    if (message.context) content.contextInfo = { stanzaId: message.context.id };
    return content;
  }

  private messageInteractiveJson(received: any) {
    const message = received.messages[0];
    const content: any = { conversation: message.interactive[message.interactive.type].title };
    if (message.context) content.contextInfo = { stanzaId: message.context.id };
    return content;
  }

  private messageButtonJson(received: any) {
    const message = received.messages[0];
    const content: any = { conversation: message.button?.text };
    if (message.context) content.contextInfo = { stanzaId: message.context.id };
    return content;
  }

  private messageReactionJson(received: any) {
    const message = received.messages[0];
    const content: any = {
      reactionMessage: { key: { id: message.reaction.message_id }, text: message.reaction.emoji },
    };
    if (message.context) content.contextInfo = { stanzaId: message.context.id };
    return content;
  }

  private messageTextJson(received: any) {
    const message = received.messages[0];
    let content: any;
    if (!message.text) {
      if (message.type === 'sticker') content = { stickerMessage: {} };
      else if (message.type === 'location')
        content = {
          locationMessage: {
            degreesLatitude: message.location?.latitude,
            degreesLongitude: message.location?.longitude,
            name: message.location?.name,
            address: message.location?.address,
          },
        };
      else content = { [message.type + 'Message']: message[message.type] || {} };
    } else {
      if (message.from === received.metadata.phone_number_id)
        content = { extendedTextMessage: { text: message.text.body } };
      else content = { conversation: message.text.body };
    }
    if (message.context) content.contextInfo = { stanzaId: message.context.id };
    return content;
  }

  private messageLocationJson(received: any) {
    const message = received.messages[0];
    const content: any = {
      locationMessage: {
        degreesLatitude: message.location.latitude,
        degreesLongitude: message.location.longitude,
        name: message.location?.name,
        address: message.location?.address,
      },
    };
    if (message.context) content.contextInfo = { stanzaId: message.context.id };
    return content;
  }

  private messageContactsJson(received: any) {
    const message = received.messages[0];
    const vcard = (contact: any) => {
      let result = `BEGIN:VCARD\nVERSION:3.0\nN:${contact.name.formatted_name}\nFN:${contact.name.formatted_name}\n`;
      if (contact.org) result += `ORG:${contact.org.company};\n`;
      if (contact.emails) result += `EMAIL:${contact.emails[0].email}\n`;
      if (contact.urls) result += `URL:${contact.urls[0].url}\n`;
      const waId = contact.phones[0]?.wa_id || createJid(contact.phones[0].phone);
      result += `item1.TEL;waid=${waId}:${contact.phones[0].phone}\nitem1.X-ABLabel:Celular\nEND:VCARD`;
      return result;
    };

    const content: any = {};
    if (message.contacts.length === 1) {
      content.contactMessage = {
        displayName: message.contacts[0].name.formatted_name,
        vcard: vcard(message.contacts[0]),
      };
    } else {
      content.contactsArrayMessage = {
        displayName: `${message.contacts.length} contacts`,
        contacts: message.contacts.map((c: any) => ({ displayName: c.name.formatted_name, vcard: vcard(c) })),
      };
    }
    if (message.context) content.contextInfo = { stanzaId: message.context.id };
    return content;
  }

  private renderMessageType(type: string) {
    const map: any = {
      text: 'conversation',
      image: 'imageMessage',
      video: 'videoMessage',
      audio: 'audioMessage',
      document: 'documentMessage',
      template: 'conversation',
      location: 'locationMessage',
      sticker: 'stickerMessage',
    };
    return map[type] || 'conversation';
  }

  private isMediaMessage(message: any) {
    return !!(message.document || message.image || message.audio || message.video);
  }
}
