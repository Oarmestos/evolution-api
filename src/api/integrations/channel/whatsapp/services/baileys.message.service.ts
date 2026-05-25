import { getBase64FromMediaMessageDto } from '@api/dto/chat.dto';
import {
  ContactMessage,
  SendAudioDto,
  SendContactDto,
  SendListDto,
  SendLocationDto,
  SendMediaDto,
  SendPollDto,
  SendReactionDto,
  SendTextDto,
} from '@api/dto/sendMessage.dto';
import * as s3Service from '@api/integrations/storage/s3/libs/minio.server';
import { PrismaRepository } from '@api/repository/repository.service';
import { chatbotController } from '@api/server.module';
import { Events } from '@api/types/wa.types';
import { Chatwoot, ConfigService, Database, S3 } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { BadRequestException } from '@exceptions';
import { createJid } from '@utils/createJid';
import { delay, isJidGroup, proto, WAPresence } from 'baileys';
import { isBase64, isURL } from 'class-validator';
import Long from 'long';
import mimeTypes from 'mime-types';
import { join } from 'path';

import {
  getBase64FromMediaMessage,
  hasValidMediaContent,
  mapMediaType,
  prepareMessage,
  processAudio,
  sendBaileysMessage,
} from '../utils/baileys-message.utils';
import { BaileysStartupService } from '../whatsapp.baileys.service';

export class BaileysMessageService {
  private readonly logger = new Logger(BaileysMessageService.name);

  constructor(
    private readonly prismaRepository: PrismaRepository,
    private readonly configService: ConfigService,
  ) {}

  public async textMessage(instance: BaileysStartupService, data: SendTextDto, isIntegration = false) {
    const text = data.text;

    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text is required');
    }

    return await this.sendMessageWithTyping(
      instance,
      data.number,
      { conversation: data.text },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        linkPreview: data?.linkPreview,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
      isIntegration,
    );
  }

  public async mediaMessage(instance: BaileysStartupService, data: SendMediaDto, file?: any, isIntegration = false) {
    const mediaData: SendMediaDto = { ...data };

    if (file?.buffer) {
      mediaData.media = file.buffer.toString('base64');
    } else if (!isURL(data.media) && !isBase64(data.media)) {
      throw new BadRequestException('File buffer, URL, or base64 media is required');
    }

    const media: any = isURL(mediaData.media) ? { url: mediaData.media } : Buffer.from(mediaData.media, 'base64');

    const message: any = {
      [data.mediatype + 'Message']: {
        url: media,
        caption: data?.caption,
        mimetype: data?.mimetype,
        fileName: data?.fileName,
      },
    };

    if (data.mediatype === 'document') {
      message.documentMessage.mimetype = data?.mimetype || mimeTypes.lookup(data.fileName).toString();
    }

    return await this.sendMessageWithTyping(
      instance,
      data.number,
      message,
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
      isIntegration,
    );
  }

  public async audioWhatsapp(instance: BaileysStartupService, data: SendAudioDto, file?: any, isIntegration = false) {
    const mediaData: SendAudioDto = { ...data };

    if (file?.buffer) {
      mediaData.audio = file.buffer.toString('base64');
    } else if (!isURL(data.audio) && !isBase64(data.audio)) {
      throw new BadRequestException('File buffer, URL, or base64 audio is required');
    }

    if (data?.encoding !== false) {
      const convert = await processAudio(this.configService, mediaData.audio);

      if (Buffer.isBuffer(convert)) {
        return await this.sendMessageWithTyping(
          instance,
          data.number,
          { audio: convert, ptt: true, mimetype: 'audio/ogg; codecs=opus' },
          { presence: 'recording', delay: data?.delay },
          isIntegration,
        );
      }
    }

    return await this.sendMessageWithTyping(
      instance,
      data.number,
      {
        audio: isURL(data.audio) ? { url: data.audio } : Buffer.from(data.audio, 'base64'),
        ptt: true,
        mimetype: 'audio/ogg; codecs=opus',
      },
      { presence: 'recording', delay: data?.delay },
      isIntegration,
    );
  }

  public async stickerMessage(instance: BaileysStartupService, data: SendMediaDto, file?: any, isIntegration = false) {
    if (file?.buffer) {
      data.media = file.buffer.toString('base64');
    }

    const sticker: any = isURL(data.media) ? { url: data.media } : Buffer.from(data.media, 'base64');

    return await this.sendMessageWithTyping(
      instance,
      data.number,
      { stickerMessage: { url: sticker } },
      { delay: data?.delay, presence: 'composing', quoted: data?.quoted },
      isIntegration,
    );
  }

  public async ptvMessage(instance: BaileysStartupService, data: SendMediaDto, file?: any, isIntegration = false) {
    if (file?.buffer) {
      data.media = file.buffer.toString('base64');
    }

    const ptv: any = isURL(data.media) ? { url: data.media } : Buffer.from(data.media, 'base64');

    return await this.sendMessageWithTyping(
      instance,
      data.number,
      { ptvMessage: { url: ptv } },
      { delay: data?.delay, presence: 'composing', quoted: data?.quoted },
      isIntegration,
    );
  }

  public async pollMessage(instance: BaileysStartupService, data: SendPollDto) {
    return await this.sendMessageWithTyping(
      instance,
      data.number,
      { poll: { name: data.name, selectableCount: data.selectableCount, values: data.values } },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        linkPreview: data?.linkPreview,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
    );
  }

  public async reactionMessage(instance: BaileysStartupService, data: SendReactionDto) {
    const remoteJid = data.key?.remoteJid || createJid(data.number);
    return await this.sendMessageWithTyping(
      instance,
      remoteJid,
      { reaction: { text: data.reaction, key: data.key } },
      {
        delay: data?.delay,
      },
    );
  }

  public async contactMessage(instance: BaileysStartupService, data: SendContactDto) {
    const vcard = (contact: ContactMessage) => {
      let result = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + `N:${contact.fullName}\n` + `FN:${contact.fullName}\n`;

      if (contact.organization) {
        result += `ORG:${contact.organization};\n`;
      }

      if (contact.email) {
        result += `EMAIL:${contact.email}\n`;
      }

      if (contact.url) {
        result += `URL:${contact.url}\n`;
      }

      const wuid = contact.wuid || createJid(contact.phoneNumber);
      result +=
        `item1.TEL;waid=${wuid.split('@')[0]}:${contact.phoneNumber}\n` + 'item1.X-ABLabel:Celular\n' + 'END:VCARD';

      return result;
    };

    let content: any;
    if (data.contact.length === 1) {
      content = { contact: { displayName: data.contact[0].fullName, vcard: vcard(data.contact[0]) } };
    } else {
      content = {
        contacts: {
          displayName: `${data.contact.length} contacts`,
          contacts: data.contact.map((c) => ({ displayName: c.fullName, vcard: vcard(c) })),
        },
      };
    }

    return await this.sendMessageWithTyping(instance, data.number, content, {
      delay: data?.delay,
      presence: 'composing',
      quoted: data?.quoted,
    });
  }

  public async locationMessage(instance: BaileysStartupService, data: SendLocationDto) {
    return await this.sendMessageWithTyping(
      instance,
      data.number,
      {
        location: {
          degreesLatitude: data.latitude,
          degreesLongitude: data.longitude,
          name: data.name,
          address: data.address,
        },
      },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
      },
    );
  }

  public async listMessage(instance: BaileysStartupService, data: SendListDto) {
    return await this.sendMessageWithTyping(
      instance,
      data.number,
      {
        listMessage: {
          title: data.title,
          description: data.description,
          buttonText: data?.buttonText,
          footerText: data?.footerText,
          sections: data.sections,
          listType: 2,
        },
      },
      {
        delay: data?.delay,
        presence: 'composing',
        quoted: data?.quoted,
        mentionsEveryOne: data?.mentionsEveryOne,
        mentioned: data?.mentioned,
      },
    );
  }

  private async sendMessageWithTyping<T = proto.IMessage>(
    instance: BaileysStartupService,
    number: string,
    message: T,
    options: any = {},
    isIntegration = false,
  ) {
    try {
      const { delay: d, presence, quoted, linkPreview, mentionsEveryOne, mentioned } = options;

      const isWA = (await instance.whatsappNumber({ numbers: [number] }))?.shift();

      if (!isWA.exists && !isJidGroup(isWA.jid) && !isWA.jid.includes('@broadcast')) {
        throw new BadRequestException(isWA);
      }

      const sender = isWA.jid;
      const mentions = mentionsEveryOne
        ? (await instance.getGroupMetadataCache(sender))?.participants?.map((p) => p.id)
        : mentioned;

      if (presence) {
        await instance.client.presenceSubscribe(sender);
        await instance.client.sendPresenceUpdate(presence as WAPresence, sender);
      }

      if (d) {
        await delay(d);
      }

      let messageSent: proto.IWebMessageInfo;
      let contextInfo: any;

      if (isJidGroup(sender)) {
        const group = await instance.getGroupMetadataCache(sender);
        contextInfo = {
          mentionedJid: mentions || [],
          groupMentions: [],
          expiration: group?.ephemeralDuration || undefined,
        };

        messageSent = await sendBaileysMessage(instance, sender, message, {
          quoted,
          linkPreview,
          contextInfo,
          ephemeralExpiration: group?.ephemeralDuration,
        });
      } else {
        contextInfo = {
          mentionedJid: mentions || [],
          groupMentions: [],
          disappearingMode: { initiator: 0 },
        };
        messageSent = await sendBaileysMessage(instance, sender, message, {
          quoted,
          linkPreview,
          contextInfo,
          ephemeralExpiration: undefined,
        });
      }

      if (presence) {
        await instance.client.sendPresenceUpdate('paused', sender);
      }

      if (Long.isLong(messageSent?.messageTimestamp)) {
        messageSent.messageTimestamp = (messageSent.messageTimestamp as Long).toNumber();
      }

      const messageRaw = prepareMessage(messageSent);
      messageRaw.instanceId = instance.instanceId;

      const isMedia =
        messageSent?.message?.imageMessage ||
        messageSent?.message?.videoMessage ||
        messageSent?.message?.stickerMessage ||
        messageSent?.message?.ptvMessage ||
        messageSent?.message?.documentMessage ||
        messageSent?.message?.documentWithCaptionMessage ||
        messageSent?.message?.audioMessage;

      const isVideo = messageSent?.message?.videoMessage;

      if (
        this.configService.get<Chatwoot>('CHATWOOT').ENABLED &&
        instance['localChatwoot']?.enabled &&
        !isIntegration
      ) {
        instance['chatwootService'].eventWhatsapp(
          Events.SEND_MESSAGE,
          { instanceName: instance.instance.name, instanceId: instance.instanceId },
          messageRaw,
        );
      }

      if (this.configService.get<Database>('DATABASE').SAVE_DATA.NEW_MESSAGE) {
        const msg = await this.prismaRepository.message.create({ data: messageRaw });

        if (isMedia && this.configService.get<S3>('S3').ENABLE) {
          try {
            if (isVideo && !this.configService.get<S3>('S3').SAVE_VIDEO) {
              this.logger.warn('Video upload is disabled.');
            } else {
              const message: any = messageRaw;
              const hasRealMedia = hasValidMediaContent(message);

              if (!hasRealMedia) {
                this.logger.warn('Message detected as media but contains no valid media content');
              } else {
                const media = await instance.getBase64FromMediaMessage({ message }, true);

                if (media) {
                  const { buffer, mediaType, fileName, size } = media;
                  const mimetype = mimeTypes.lookup(fileName).toString();
                  const fullName = join(
                    `${instance.instance.id}`,
                    messageRaw.key.remoteJid,
                    `${messageRaw.key.id}`,
                    mediaType,
                    fileName,
                  );

                  await s3Service.uploadFile(fullName, buffer, (size.fileLength as any)?.low || size.fileLength, {
                    'Content-Type': mimetype,
                  });

                  await this.prismaRepository.media.create({
                    data: {
                      messageId: msg.id,
                      instanceId: instance.instanceId,
                      type: mediaType,
                      fileName: fullName,
                      mimetype,
                    },
                  });

                  const mediaUrl = await s3Service.getObjectUrl(fullName);
                  messageRaw.message.mediaUrl = mediaUrl;

                  await this.prismaRepository.message.update({ where: { id: msg.id }, data: messageRaw });
                }
              }
            }
          } catch (error) {
            this.logger.error(['Error on upload file to minio', error?.message, error?.stack]);
          }
        }
      }

      instance.sendDataWebhook(Events.SEND_MESSAGE, messageRaw);

      if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && instance['localChatwoot']?.enabled && isIntegration) {
        await chatbotController.emit({
          instance: { instanceName: instance.instance.name, instanceId: instance.instanceId },
          remoteJid: messageRaw.key.remoteJid,
          msg: messageRaw,
          pushName: messageRaw.pushName,
          isIntegration,
        });
      }

      return messageRaw;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.toString());
    }
  }

  public prepareMessage(message: proto.IWebMessageInfo): any {
    return prepareMessage(message);
  }

  public hasValidMediaContent(message: any): boolean {
    return hasValidMediaContent(message);
  }

  public async mapMediaType(mediaType: string) {
    return mapMediaType(mediaType);
  }

  public async getBase64FromMediaMessage(data: getBase64FromMediaMessageDto, getBuffer = false) {
    return getBase64FromMediaMessage(data, getBuffer);
  }
}
