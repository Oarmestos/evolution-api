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
import { AudioConverter, Chatwoot, ConfigService, Database, S3 } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { BadRequestException, InternalServerErrorException } from '@exceptions';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { createJid } from '@utils/createJid';
import axios from 'axios';
import { AnyMessageContent, delay, getContentType, isJidGroup, proto, WAPresence } from 'baileys';
import { spawn } from 'child_process';
import { isBase64, isURL } from 'class-validator';
import ffmpeg from 'fluent-ffmpeg';
import FormData from 'form-data';
import Long from 'long';
import mimeTypes from 'mime-types';
import { join } from 'path';
import { PassThrough } from 'stream';

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
      const convert = await this.processAudio(mediaData.audio);

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

        messageSent = await this.sendMessage(
          instance,
          sender,
          message,
          mentions,
          linkPreview,
          quoted,
          group?.ephemeralDuration,
          contextInfo,
        );
      } else {
        contextInfo = {
          mentionedJid: mentions || [],
          groupMentions: [],
          disappearingMode: { initiator: 0 },
        };
        messageSent = await this.sendMessage(
          instance,
          sender,
          message,
          mentions,
          linkPreview,
          quoted,
          undefined,
          contextInfo,
        );
      }

      if (presence) {
        await instance.client.sendPresenceUpdate('paused', sender);
      }

      if (Long.isLong(messageSent?.messageTimestamp)) {
        messageSent.messageTimestamp = (messageSent.messageTimestamp as Long).toNumber();
      }

      const messageRaw = this.prepareMessage(messageSent);
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
              const hasRealMedia = this.hasValidMediaContent(message);

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

                  await s3Service.uploadFile(fullName, buffer, size.fileLength?.low || size.fileLength, {
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

  private async sendMessage(
    instance: BaileysStartupService,
    sender: string,
    message: any,
    mentions: any,
    linkPreview: any,
    quoted: any,
    ephemeralExpiration: any,
    contextInfo: any,
  ) {
    if (message.reaction) {
      return await instance.client.sendMessage(sender, message.reaction, { quoted });
    }

    if (message.poll) {
      return await instance.client.sendMessage(sender, message.poll, { quoted });
    }

    const options: any = {
      quoted,
      linkPreview,
      contextInfo,
      ephemeralExpiration,
    };

    return await instance.client.sendMessage(sender, message as AnyMessageContent, options);
  }

  public prepareMessage(message: proto.IWebMessageInfo): any {
    const contentType = getContentType(message.message);
    const contentMsg = message?.message[contentType] as any;

    const messageRaw: any = {
      key: message.key,
      pushName: message.pushName,
      status: message.status,
      message: this.deserializeMessageBuffers({ ...message.message }),
      contextInfo: this.deserializeMessageBuffers(contentMsg?.contextInfo),
      messageType: contentType || 'unknown',
      messageTimestamp: Long.isLong(message.messageTimestamp)
        ? (message.messageTimestamp as Long).toNumber()
        : message.messageTimestamp,
    };

    if (messageRaw.message?.conversation) {
      messageRaw.messageType = 'conversation';
    } else if (messageRaw.message?.extendedTextMessage) {
      messageRaw.messageType = 'conversation';
      messageRaw.message.conversation = messageRaw.message.extendedTextMessage.text;
      if (messageRaw.message.extendedTextMessage.contextInfo) {
        messageRaw.contextInfo = messageRaw.message.extendedTextMessage.contextInfo;
      }
      delete messageRaw.message.extendedTextMessage;
    }

    return messageRaw;
  }

  private deserializeMessageBuffers(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'object' && !Array.isArray(obj) && !Buffer.isBuffer(obj)) {
      const keys = Object.keys(obj);
      const isIndexedObject = keys.every((key) => !isNaN(Number(key)));
      if (isIndexedObject && keys.length > 0) {
        const values = keys.sort((a, b) => Number(a) - Number(b)).map((key) => obj[key]);
        return new Uint8Array(values);
      }
      const converted = {};
      for (const key of keys) {
        converted[key] = this.deserializeMessageBuffers(obj[key]);
      }
      return converted;
    }

    if (Buffer.isBuffer(obj)) return new Uint8Array(obj);
    return obj;
  }

  public hasValidMediaContent(message: any): boolean {
    const msg = message.message;
    return !!(
      msg?.imageMessage?.url ||
      msg?.videoMessage?.url ||
      msg?.audioMessage?.url ||
      msg?.documentMessage?.url ||
      msg?.stickerMessage?.url ||
      msg?.ptvMessage?.url
    );
  }

  public async processAudio(audio: string): Promise<Buffer> {
    const audioConverterConfig = this.configService.get<AudioConverter>('AUDIO_CONVERTER');
    if (audioConverterConfig.API_URL) {
      const formData = new FormData();
      if (isURL(audio)) formData.append('url', audio);
      else formData.append('base64', audio);

      const { data } = await axios.post(audioConverterConfig.API_URL, formData, {
        headers: { ...formData.getHeaders(), apikey: audioConverterConfig.API_KEY },
      });

      if (!data.audio) throw new InternalServerErrorException('Failed to convert audio');
      return Buffer.from(data.audio, 'base64');
    } else {
      let inputAudioStream: PassThrough;
      if (isURL(audio)) {
        const response = await axios.get(audio, { responseType: 'stream' });
        inputAudioStream = response.data.pipe(new PassThrough());
      } else {
        inputAudioStream = new PassThrough();
        inputAudioStream.end(Buffer.from(audio, 'base64'));
      }

      return new Promise((resolve, reject) => {
        const outputAudioStream = new PassThrough();
        const chunks: Buffer[] = [];
        outputAudioStream.on('data', (chunk) => chunks.push(chunk));
        outputAudioStream.on('end', () => resolve(Buffer.concat(chunks)));
        outputAudioStream.on('error', reject);

        ffmpeg.setFfmpegPath(ffmpegPath.path);
        ffmpeg(inputAudioStream)
          .outputFormat('ogg')
          .noVideo()
          .audioCodec('libopus')
          .audioBitrate('128k')
          .audioFrequency(48000)
          .audioChannels(1)
          .pipe(outputAudioStream, { end: true })
          .on('error', reject);
      });
    }
  }

  public async processAudioMp4(audio: string) {
    let inputStream: PassThrough;
    if (isURL(audio)) {
      const response = await axios.get(audio, { responseType: 'stream' });
      inputStream = response.data;
    } else {
      inputStream = new PassThrough();
      inputStream.end(Buffer.from(audio, 'base64'));
    }

    return new Promise<Buffer>((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpegPath.path, [
        '-i',
        'pipe:0',
        '-vn',
        '-ab',
        '128k',
        '-ar',
        '44100',
        '-f',
        'mp4',
        '-movflags',
        'frag_keyframe+empty_moov',
        'pipe:1',
      ]);
      const outputChunks: Buffer[] = [];
      ffmpegProcess.stdout.on('data', (chunk) => outputChunks.push(chunk));
      ffmpegProcess.on('close', (code) => {
        if (code === 0) resolve(Buffer.concat(outputChunks));
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
      inputStream.pipe(ffmpegProcess.stdin);
    });
  }

  public async mapMediaType(mediaType: string) {
    const map = {
      imageMessage: 'image',
      videoMessage: 'video',
      documentMessage: 'document',
      stickerMessage: 'sticker',
      audioMessage: 'audio',
      ptvMessage: 'video',
    };
    return map[mediaType] || null;
  }
}
