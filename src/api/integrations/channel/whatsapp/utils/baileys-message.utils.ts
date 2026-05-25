import { getBase64FromMediaMessageDto } from '@api/dto/chat.dto';
import { AudioConverter, ConfigService } from '@config/env.config';
import { InternalServerErrorException } from '@exceptions';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import axios from 'axios';
import { AnyMessageContent, getContentType, proto } from 'baileys';
import { spawn } from 'child_process';
import { isURL } from 'class-validator';
import ffmpeg from 'fluent-ffmpeg';
import FormData from 'form-data';
import Long from 'long';
import { PassThrough } from 'stream';

export function deserializeMessageBuffers(obj: any): any {
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
      converted[key] = deserializeMessageBuffers(obj[key]);
    }
    return converted;
  }

  if (Buffer.isBuffer(obj)) return new Uint8Array(obj);
  return obj;
}

export function prepareMessage(message: proto.IWebMessageInfo): any {
  const contentType = getContentType(message.message);
  const contentMsg = message?.message[contentType] as any;

  const messageRaw: any = {
    key: message.key,
    pushName: message.pushName,
    status: message.status,
    message: deserializeMessageBuffers({ ...message.message }),
    contextInfo: deserializeMessageBuffers(contentMsg?.contextInfo),
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

export function hasValidMediaContent(message: any): boolean {
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

export function mapMediaType(mediaType: string): string | null {
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

export async function processAudio(configService: ConfigService, audio: string): Promise<Buffer> {
  const audioConverterConfig = configService.get<AudioConverter>('AUDIO_CONVERTER');
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

export async function processAudioMp4(audio: string): Promise<Buffer> {
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

export async function getBase64FromMediaMessage(data: getBase64FromMediaMessageDto, getBuffer = false) {
  try {
    const { downloadMediaMessage, getContentType } = await import('baileys');
    const buffer = await downloadMediaMessage(data.message as any, 'buffer', {});

    if (getBuffer) {
      const messageType = getContentType(data.message.message);
      const mediaType = mapMediaType(messageType);
      const content = data.message.message[messageType] as any;
      const fileName = content?.fileName || `media.${content?.mimetype?.split('/')?.[1] || 'bin'}`;
      return {
        buffer,
        mediaType,
        fileName,
        size: { fileLength: buffer.length },
      };
    }

    const messageType = getContentType(data.message.message);
    const content = data.message.message[messageType] as any;
    const mimetype = content?.mimetype || 'image/jpeg';
    const base64 = buffer.toString('base64');

    return {
      base64,
      mimetype,
    };
  } catch (error) {
    throw new InternalServerErrorException('Error downloading media message', error.toString());
  }
}

export async function sendBaileysMessage(
  instance: any,
  sender: string,
  message: any,
  options: {
    quoted?: any;
    linkPreview?: any;
    contextInfo?: any;
    ephemeralExpiration?: any;
  },
) {
  if (message.reaction) {
    return await instance.client.sendMessage(sender, message.reaction, { quoted: options.quoted });
  }

  if (message.poll) {
    return await instance.client.sendMessage(sender, message.poll, { quoted: options.quoted });
  }

  const sendOptions: any = {
    quoted: options.quoted,
    linkPreview: options.linkPreview,
    contextInfo: options.contextInfo,
    ephemeralExpiration: options.ephemeralExpiration,
  };

  return await instance.client.sendMessage(sender, message as AnyMessageContent, sendOptions);
}
