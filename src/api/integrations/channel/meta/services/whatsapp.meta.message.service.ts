import {
  ContactMessage,
  MediaMessage,
  Options,
  SendAudioDto,
  SendButtonsDto,
  SendContactDto,
  SendListDto,
  SendLocationDto,
  SendMediaDto,
  SendReactionDto,
  SendTemplateDto,
  SendTextDto,
} from '@api/dto/sendMessage.dto';
import { ChatwootService } from '@api/integrations/chatbot/chatwoot/services/chatwoot.service';
import { PrismaRepository } from '@api/repository/repository.service';
import { chatbotController } from '@api/server.module';
import { Events, wa } from '@api/types/wa.types';
import { AudioConverter, Chatwoot, ConfigService, WaBusiness } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { BadRequestException, InternalServerErrorException } from '@exceptions';
import { createJid } from '@utils/createJid';
import { status } from '@utils/renderStatus';
import axios from 'axios';
import { arrayUnique, isURL } from 'class-validator';
import FormData from 'form-data';
import mimeTypes from 'mime-types';

import { MetaMediaService } from './whatsapp.meta.media.service';

export class MetaMessageService {
  private readonly logger = new Logger('MetaMessageService');

  constructor(
    private readonly instance: wa.Instance,
    private readonly configService: ConfigService,
    private readonly prismaRepository: PrismaRepository,
    private readonly chatwootService: ChatwootService,
    private readonly mediaService: MetaMediaService,
    private readonly localChatwoot: wa.LocalChatwoot,
    private readonly sendDataWebhook: (event: string, data: any) => void,
  ) {}

  private get instanceId() {
    return this.instance.id;
  }

  private get token() {
    return this.instance.token;
  }

  private get number() {
    return this.instance.number;
  }

  private async post(message: any, params: string) {
    try {
      let urlServer = this.configService.get<WaBusiness>('WA_BUSINESS').URL;
      const version = this.configService.get<WaBusiness>('WA_BUSINESS').VERSION;
      urlServer = `${urlServer}/${version}/${this.number}/${params}`;
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
      const result = await axios.post(urlServer, message, { headers });
      return result.data;
    } catch (e) {
      return e.response?.data?.error;
    }
  }

  public async sendMessageWithTyping(number: string, message: any, options?: Options, isIntegration = false) {
    try {
      let quoted: any;
      let webhookUrl: any;
      if (options?.quoted) quoted = options.quoted.key;
      if (options?.webhookUrl) webhookUrl = options.webhookUrl;

      let content: any;
      const cleanNumber = number.replace(/\D/g, '');

      const messageSent = await (async () => {
        if (message['reactionMessage']) {
          content = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            type: 'reaction',
            to: cleanNumber,
            reaction: {
              message_id: message['reactionMessage']['key']['id'],
              emoji: message['reactionMessage']['text'],
            },
          };
          if (quoted) content.context = { message_id: quoted.id };
          return await this.post(content, 'messages');
        }
        if (message['locationMessage']) {
          content = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            type: 'location',
            to: cleanNumber,
            location: {
              longitude: message['locationMessage']['degreesLongitude'],
              latitude: message['locationMessage']['degreesLatitude'],
              name: message['locationMessage']['name'],
              address: message['locationMessage']['address'],
            },
          };
          if (quoted) content.context = { message_id: quoted.id };
          return await this.post(content, 'messages');
        }
        if (message['contacts']) {
          content = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            type: 'contacts',
            to: cleanNumber,
            contacts: message['contacts'],
          };
          if (quoted) content.context = { message_id: quoted.id };
          return await this.post(content, 'messages');
        }
        if (message['conversation']) {
          content = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            type: 'text',
            to: cleanNumber,
            text: { body: message['conversation'], preview_url: Boolean(options?.linkPreview) },
          };
          if (quoted) content.context = { message_id: quoted.id };
          return await this.post(content, 'messages');
        }
        if (message['media']) {
          content = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            type: message['mediaType'],
            to: cleanNumber,
            [message['mediaType']]: {
              [message['type']]: message['id'],
              ...(message['mediaType'] !== 'audio' &&
                message['mediaType'] !== 'video' &&
                message['fileName'] &&
                !message['mimetype']?.startsWith('image/') && { filename: message['fileName'] }),
              ...(message['mediaType'] !== 'audio' && message['caption'] && { caption: message['caption'] }),
            },
          };
          if (quoted) content.context = { message_id: quoted.id };
          return await this.post(content, 'messages');
        }
        if (message['audio']) {
          content = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            type: 'audio',
            to: cleanNumber,
            audio: { [message['type']]: message['id'] },
          };
          if (quoted) content.context = { message_id: quoted.id };
          return await this.post(content, 'messages');
        }
        if (message['buttons']) {
          content = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanNumber,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: message['text'] || 'Select' },
              action: { buttons: message['buttons'] },
            },
          };
          if (quoted) content.context = { message_id: quoted.id };
          return await this.post(content, 'messages');
        }
        if (message['listMessage']) {
          content = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanNumber,
            type: 'interactive',
            interactive: {
              type: 'list',
              header: { type: 'text', text: message['listMessage']['title'] },
              body: { text: message['listMessage']['description'] },
              footer: { text: message['listMessage']['footerText'] },
              action: { button: message['listMessage']['buttonText'], sections: message['listMessage']['sections'] },
            },
          };
          if (quoted) content.context = { message_id: quoted.id };
          return await this.post(content, 'messages');
        }
        if (message['template']) {
          content = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanNumber,
            type: 'template',
            template: {
              name: message['template']['name'],
              language: { code: message['template']['language'] || 'en_US' },
              components: message['template']['components'],
            },
          };
          if (quoted) content.context = { message_id: quoted.id };
          return await this.post(content, 'messages');
        }
      })();

      if (messageSent?.error_data || messageSent?.message) {
        this.logger.error(messageSent);
        return messageSent;
      }

      const messageRaw: any = {
        key: { fromMe: true, id: messageSent?.messages[0]?.id, remoteJid: createJid(number) },
        message: this.convertMessageToRaw(message, content),
        messageType: this.renderMessageType(content.type),
        messageTimestamp: (messageSent?.messages[0]?.timestamp as number) || Math.round(new Date().getTime() / 1000),
        instanceId: this.instanceId,
        webhookUrl,
        status: status[1],
        source: 'unknown',
      };

      this.sendDataWebhook(Events.SEND_MESSAGE, messageRaw);

      if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled && !isIntegration) {
        this.chatwootService.eventWhatsapp(
          Events.SEND_MESSAGE,
          { instanceName: this.instance.name, instanceId: this.instanceId },
          messageRaw,
        );
      }

      if (this.configService.get<Chatwoot>('CHATWOOT').ENABLED && this.localChatwoot?.enabled && isIntegration) {
        await chatbotController.emit({
          instance: { instanceName: this.instance.name, instanceId: this.instanceId },
          remoteJid: messageRaw.key.remoteJid,
          msg: messageRaw,
        });
      }

      await this.prismaRepository.message.create({ data: messageRaw });
      return messageRaw;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.toString());
    }
  }

  public async textMessage(data: SendTextDto, isIntegration = false) {
    return await this.sendMessageWithTyping(
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

  public async mediaMessage(data: SendMediaDto, file?: any, isIntegration = false) {
    const mediaData = { ...data };
    if (file) mediaData.media = file.buffer.toString('base64');
    const message = await this.prepareMediaMessage(mediaData);
    return await this.sendMessageWithTyping(
      data.number,
      { ...message },
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

  public async audioWhatsapp(data: SendAudioDto, file?: any, isIntegration = false) {
    const message = await this.processAudio(data.audio, data.number, file);
    return await this.sendMessageWithTyping(
      data.number,
      { ...message },
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

  private async prepareMediaMessage(mediaMessage: MediaMessage) {
    const prepareMedia: any = {
      caption: mediaMessage?.caption,
      fileName:
        mediaMessage.fileName ||
        (mediaMessage.mediatype === 'image' ? 'image.png' : mediaMessage.mediatype === 'video' ? 'video.mp4' : 'file'),
      mediaType: mediaMessage.mediatype,
      media: mediaMessage.media,
      gifPlayback: false,
    };
    if (isURL(mediaMessage.media)) {
      prepareMedia.id = mediaMessage.media;
      prepareMedia.type = 'link';
      prepareMedia.mimetype = mimeTypes.lookup(mediaMessage.media);
    } else {
      prepareMedia.mimetype = mimeTypes.lookup(prepareMedia.fileName);
      prepareMedia.id = await this.mediaService.getIdMedia(prepareMedia);
      prepareMedia.type = 'id';
    }
    return prepareMedia;
  }

  private async processAudio(audio: string, number: string, file: any) {
    const hash = `${number.replace(/\D/g, '')}-${new Date().getTime()}`;
    const convConfig = this.configService.get<AudioConverter>('AUDIO_CONVERTER');
    if (convConfig.API_URL) {
      const formData = new FormData();
      if (file) formData.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
      else if (isURL(audio)) formData.append('url', audio);
      else formData.append('base64', audio);
      formData.append('format', 'mp3');

      const response = await axios.post(convConfig.API_URL, formData, {
        headers: { ...formData.getHeaders(), apikey: convConfig.API_KEY },
      });
      const converted = response?.data?.audio || response?.data?.url;
      const prepareMedia = {
        fileName: `${hash}.mp3`,
        mediaType: 'audio',
        media: converted,
        mimetype: 'audio/mpeg',
        type: 'id',
        id: '',
      };
      prepareMedia.id = await this.mediaService.getIdMedia(prepareMedia);
      return prepareMedia;
    } else {
      const prepareMedia: any = { fileName: `${hash}.mp3`, mediaType: 'audio', media: audio };
      if (isURL(audio)) {
        prepareMedia.id = audio;
        prepareMedia.type = 'link';
        prepareMedia.mimetype = mimeTypes.lookup(audio);
      } else if (file) {
        prepareMedia.media = file;
        prepareMedia.id = await this.mediaService.getIdMedia(prepareMedia, true);
        prepareMedia.type = 'id';
        prepareMedia.mimetype = file.mimetype;
      } else {
        prepareMedia.id = await this.mediaService.getIdMedia(prepareMedia);
        prepareMedia.type = 'id';
        prepareMedia.mimetype = mimeTypes.lookup(prepareMedia.fileName);
      }
      return prepareMedia;
    }
  }

  public async buttonMessage(data: SendButtonsDto) {
    if (!arrayUnique(data.buttons.map((b) => b.displayText)) || !arrayUnique(data.buttons.map((b) => b.id))) {
      throw new BadRequestException('Buttons cannot have repeating texts or IDs');
    }
    return await this.sendMessageWithTyping(
      data.number,
      {
        text: data.title,
        buttons: data.buttons.map((b) => ({ type: 'reply', reply: { title: b.displayText, id: b.id } })),
      },
      { delay: data?.delay, presence: 'composing', quoted: data?.quoted },
    );
  }

  public async locationMessage(data: SendLocationDto) {
    return await this.sendMessageWithTyping(
      data.number,
      {
        locationMessage: {
          degreesLatitude: data.latitude,
          degreesLongitude: data.longitude,
          name: data?.name,
          address: data?.address,
        },
      },
      { delay: data?.delay, presence: 'composing', quoted: data?.quoted },
    );
  }

  public async listMessage(data: SendListDto) {
    return await this.sendMessageWithTyping(
      data.number,
      {
        listMessage: {
          title: data.title,
          description: data.description,
          footerText: data?.footerText,
          buttonText: data?.buttonText,
          sections: data.sections.map((s) => ({
            title: s.title,
            rows: s.rows.map((r) => ({ title: r.title, description: r.description.substring(0, 72), id: r.rowId })),
          })),
        },
      },
      { delay: data?.delay, presence: 'composing', quoted: data?.quoted },
    );
  }

  public async templateMessage(data: SendTemplateDto, isIntegration = false) {
    return await this.sendMessageWithTyping(
      data.number,
      { template: { name: data.name, language: data.language, components: data.components } },
      { delay: data?.delay, presence: 'composing', quoted: data?.quoted, webhookUrl: data?.webhookUrl },
      isIntegration,
    );
  }

  public async contactMessage(data: SendContactDto) {
    const vcard = (c: ContactMessage) => {
      const waid = c.wuid || createJid(c.phoneNumber);
      return `BEGIN:VCARD\nVERSION:3.0\nN:${c.fullName}\nFN:${c.fullName}\n${c.organization ? `ORG:${c.organization};\n` : ''}${c.email ? `EMAIL:${c.email}\n` : ''}${c.url ? `URL:${c.url}\n` : ''}item1.TEL;waid=${waid}:${c.phoneNumber}\nitem1.X-ABLabel:Celular\nEND:VCARD`;
    };

    const message: any =
      data.contact.length === 1
        ? { contact: { displayName: data.contact[0].fullName, vcard: vcard(data.contact[0]) } }
        : {
            contactsArrayMessage: {
              displayName: `${data.contact.length} contacts`,
              contacts: data.contact.map((c) => ({ displayName: c.fullName, vcard: vcard(c) })),
            },
          };

    return await this.sendMessageWithTyping(
      data.number,
      {
        contacts: data.contact.map((c) => ({
          name: { formatted_name: c.fullName },
          phones: [{ phone: c.phoneNumber }],
          urls: c.url ? [{ url: c.url }] : [],
          emails: c.email ? [{ email: c.email }] : [],
          org: c.organization ? { company: c.organization } : undefined,
        })),
        message,
      },
      { delay: data?.delay, presence: 'composing' },
    );
  }

  public async reactionMessage(data: SendReactionDto) {
    return await this.sendMessageWithTyping(data.key.remoteJid, {
      reactionMessage: { key: data.key, text: data.reaction },
    });
  }

  private convertMessageToRaw(message: any, content: any) {
    const stanzaId = content?.context?.message_id;
    if (message?.conversation) return stanzaId ? { ...message, contextInfo: { stanzaId } } : message;

    const type = message?.mediaType;
    if (['image', 'video', 'audio', 'document'].includes(type)) {
      const key = `${type}Message`;
      return stanzaId ? { [key]: message, contextInfo: { stanzaId } } : { [key]: message };
    }
    return message;
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
      reaction: 'reactionMessage',
    };
    return map[type] || 'conversation';
  }
}
