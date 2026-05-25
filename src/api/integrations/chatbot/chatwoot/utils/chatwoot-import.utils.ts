import { postgresClient } from '@api/integrations/chatbot/chatwoot/libs/postgres.client';
import { ChatwootService } from '@api/integrations/chatbot/chatwoot/services/chatwoot.service';
import { Chatwoot, configService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { Chatwoot as ChatwootModel, Message } from '@prisma/client';
import { proto } from 'baileys';

const logger = new Logger('ChatwootImportUtils');

export type ChatwootUser = {
  user_type: string;
  user_id: number;
};

export type IWebMessageInfo = Omit<proto.IWebMessageInfo, 'key'> & Partial<Pick<proto.IWebMessageInfo, 'key'>>;

export function isGroup(remoteJid: string): boolean {
  return remoteJid.includes('@g.us');
}

export function isIgnorePhoneNumber(remoteJid: string): boolean {
  return isGroup(remoteJid) || remoteJid === 'status@broadcast' || remoteJid === '0@s.whatsapp.net';
}

export function sliceIntoChunks<T>(arr: T[], chunkSize: number): T[] {
  return arr.splice(0, chunkSize);
}

export function createMessagesMapByPhoneNumber(messages: Message[]): Map<string, Message[]> {
  return messages.reduce((acc: Map<string, Message[]>, message: Message) => {
    const key = message?.key as {
      remoteJid: string;
    };
    if (!isIgnorePhoneNumber(key?.remoteJid)) {
      const phoneNumber = key?.remoteJid?.split('@')[0];
      if (phoneNumber) {
        const phoneNumberPlus = `+${phoneNumber}`;
        const messagesList = acc.has(phoneNumberPlus) ? acc.get(phoneNumberPlus) : [];
        messagesList.push(message);
        acc.set(phoneNumberPlus, messagesList);
      }
    }

    return acc;
  }, new Map());
}

export async function getChatwootUser(provider: ChatwootModel): Promise<ChatwootUser | false> {
  try {
    const pgClient = postgresClient.getChatwootConnection();

    const sqlUser = `SELECT owner_type AS user_type, owner_id AS user_id
                       FROM access_tokens
                     WHERE token = $1`;

    return (await pgClient.query(sqlUser, [provider.token]))?.rows[0] || false;
  } catch (error) {
    logger.error(`Error on getChatwootUser: ${error.toString()}`);
    return false;
  }
}

export function getContentMessage(chatwootService: ChatwootService, msg: IWebMessageInfo): string {
  const contentMessage = chatwootService.getConversationMessage(msg.message);
  if (contentMessage) {
    return contentMessage;
  }

  if (!configService.get<Chatwoot>('CHATWOOT').IMPORT.PLACEHOLDER_MEDIA_MESSAGE) {
    return '';
  }

  const types = {
    documentMessage: msg.message.documentMessage,
    documentWithCaptionMessage: msg.message.documentWithCaptionMessage?.message?.documentMessage,
    imageMessage: msg.message.imageMessage,
    videoMessage: msg.message.videoMessage,
    audioMessage: msg.message.audioMessage,
    stickerMessage: msg.message.stickerMessage,
    templateMessage: msg.message.templateMessage?.hydratedTemplate?.hydratedContentText,
  };

  const typeKey = Object.keys(types).find((key) => types[key] !== undefined && types[key] !== null);
  switch (typeKey) {
    case 'documentMessage': {
      const doc = msg.message.documentMessage;
      const fileName = doc?.fileName || 'document';
      const caption = doc?.caption ? ` ${doc.caption}` : '';
      return `_<File: ${fileName}${caption}>_`;
    }

    case 'documentWithCaptionMessage': {
      const doc = msg.message.documentWithCaptionMessage?.message?.documentMessage;
      const fileName = doc?.fileName || 'document';
      const caption = doc?.caption ? ` ${doc.caption}` : '';
      return `_<File: ${fileName}${caption}>_`;
    }

    case 'templateMessage': {
      const template = msg.message.templateMessage?.hydratedTemplate;
      return (
        (template?.hydratedTitleText ? `*${template.hydratedTitleText}*\n` : '') + (template?.hydratedContentText || '')
      );
    }

    case 'imageMessage':
      return '_<Image Message>_';

    case 'videoMessage':
      return '_<Video Message>_';

    case 'audioMessage':
      return '_<Audio Message>_';

    case 'stickerMessage':
      return '_<Sticker Message>_';

    default:
      return '';
  }
}
