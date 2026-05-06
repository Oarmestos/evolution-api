import { wa } from '@api/types/wa.types';
import { ConfigService, WaBusiness } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { BadRequestException, InternalServerErrorException } from '@exceptions';
import axios from 'axios';
import { isURL } from 'class-validator';
import FormData from 'form-data';

export class MetaMediaService {
  private readonly logger = new Logger('MetaMediaService');

  constructor(
    private readonly instance: wa.Instance,
    private readonly configService: ConfigService,
  ) {}

  private get token() {
    return this.instance.token;
  }

  private get number() {
    return this.instance.number;
  }

  public async downloadMediaMessage(message: any) {
    try {
      const id = message[message.type].id;
      let urlServer = this.configService.get<WaBusiness>('WA_BUSINESS').URL;
      const version = this.configService.get<WaBusiness>('WA_BUSINESS').VERSION;
      urlServer = `${urlServer}/${version}/${id}`;
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };

      // Primeiro, obtenha a URL do arquivo
      let result = await axios.get(urlServer, { headers });

      // Depois, baixe o arquivo usando a URL retornada
      result = await axios.get(result.data.url, {
        headers: { Authorization: `Bearer ${this.token}` },
        responseType: 'arraybuffer',
      });

      return result.data;
    } catch (e) {
      this.logger.error(`Error downloading media: ${e}`);
      throw e;
    }
  }

  public async getIdMedia(mediaMessage: any, isFile = false) {
    try {
      const formData = new FormData();

      if (isFile === false) {
        if (isURL(mediaMessage.media)) {
          const response = await axios.get(mediaMessage.media, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data, 'base64');
          formData.append('file', buffer, {
            filename: mediaMessage.fileName || 'media',
            contentType: mediaMessage.mimetype,
          });
        } else {
          const buffer = Buffer.from(mediaMessage.media, 'base64');
          formData.append('file', buffer, {
            filename: mediaMessage.fileName || 'media',
            contentType: mediaMessage.mimetype,
          });
        }
      } else {
        formData.append('file', mediaMessage.media.buffer, {
          filename: mediaMessage.media.originalname,
          contentType: mediaMessage.media.mimetype,
        });
      }

      const mimetype = mediaMessage.mimetype || mediaMessage.media.mimetype;

      formData.append('typeFile', mimetype);
      formData.append('messaging_product', 'whatsapp');

      const headers = { Authorization: `Bearer ${this.token}` };
      const url = `${this.configService.get<WaBusiness>('WA_BUSINESS').URL}/${
        this.configService.get<WaBusiness>('WA_BUSINESS').VERSION
      }/${this.number}/media`;

      const res = await axios.post(url, formData, { headers });
      return res.data.id;
    } catch (error) {
      this.logger.error(error.response?.data || error);
      throw new InternalServerErrorException(error?.toString() || error);
    }
  }

  public async getBase64FromMediaMessage(data: any) {
    try {
      const msg = data.message;
      const messageType = msg.messageType.includes('Message') ? msg.messageType : msg.messageType + 'Message';
      const mediaMessage = msg.message[messageType];

      if (!msg.message?.base64) {
        const buffer = await this.downloadMediaMessage({ type: messageType, ...msg.message });
        msg.message.base64 = buffer.toString('base64');
      }

      return {
        mediaType: msg.messageType,
        fileName: mediaMessage?.fileName || mediaMessage?.filename,
        caption: mediaMessage?.caption,
        size: {
          fileLength: mediaMessage?.fileLength,
          height: mediaMessage?.fileLength,
          width: mediaMessage?.width,
        },
        mimetype: mediaMessage?.mime_type,
        base64: msg.message.base64,
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.toString());
    }
  }

  public hasValidMediaContent(messageRaw: any): boolean {
    const message = messageRaw.message;
    if (!message) return false;

    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
    for (const type of mediaTypes) {
      if (message[type] && message[type].id) {
        return true;
      }
    }
    return false;
  }
}
