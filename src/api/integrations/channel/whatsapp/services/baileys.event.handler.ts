import { Events } from '@api/types/wa.types';
import { status } from '@utils/renderStatus';
import {
  BufferedEventData,
  Chat,
  DisconnectReason,
  getContentType,
  MessageUpsertType,
  proto,
  WAMessage,
} from 'baileys';

export class BaileysEventHandler {
  constructor(private readonly service: any) {}

  public readonly chatHandle = {
    'chats.upsert': async (chats: Chat[]) => {
      const existingChatIds = await this.service.prismaRepository.chat.findMany({
        where: { instanceId: this.service.instanceId },
        select: { remoteJid: true },
      });

      const existingChatIdSet = new Set(existingChatIds.map((chat: any) => chat.remoteJid));

      const chatsToInsert = chats
        .filter((chat) => !existingChatIdSet?.has(chat.id))
        .map((chat) => ({
          remoteJid: chat.id,
          instanceId: this.service.instanceId,
          name: chat.name,
          unreadMessages: chat.unreadCount !== undefined ? chat.unreadCount : 0,
        }));

      this.service.sendDataWebhook(Events.CHATS_UPSERT, chatsToInsert);

      if (chatsToInsert.length > 0) {
        if (this.service.configService.get('DATABASE').SAVE_DATA.CHATS)
          await this.service.prismaRepository.chat.createMany({ data: chatsToInsert, skipDuplicates: true });
      }
    },

    'chats.update': async (
      chats: Partial<
        proto.IConversation & { lastMessageRecvTimestamp?: number } & {
          conditional: (bufferedData: BufferedEventData) => boolean;
        }
      >[],
    ) => {
      const chatsRaw = chats.map((chat) => {
        return { remoteJid: chat.id, instanceId: this.service.instanceId };
      });

      this.service.sendDataWebhook(Events.CHATS_UPDATE, chatsRaw);

      for (const chat of chats) {
        await this.service.prismaRepository.chat.updateMany({
          where: { instanceId: this.service.instanceId, remoteJid: chat.id, name: chat.name },
          data: { remoteJid: chat.id },
        });
      }
    },

    'chats.delete': async (chats: string[]) => {
      chats.forEach(
        async (chat) =>
          await this.service.prismaRepository.chat.deleteMany({
            where: { instanceId: this.service.instanceId, remoteJid: chat },
          }),
      );

      this.service.sendDataWebhook(Events.CHATS_DELETE, [...chats]);
    },
  };

  public readonly messageHandle = {
    'messages.upsert': async (m: { messages: WAMessage[]; type: MessageUpsertType }) => {
      if (m.type === 'append') return;

      for (const msg of m.messages) {
        if (!msg.message) continue;

        const remoteJid = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const id = msg.key.id;

        // Process message content
        const messageType = getContentType(msg.message);
        if (!messageType) continue;

        // Save to DB
        await this.service.prismaRepository.message.upsert({
          where: {
            instanceId_keyId: {
              instanceId: this.service.instanceId,
              keyId: id,
            },
          },
          update: {
            message: msg.message as any,
            pushName: msg.pushName || undefined,
          },
          create: {
            instanceId: this.service.instanceId,
            keyId: id,
            key: msg.key as any,
            message: msg.message as any,
            messageType,
            messageTimestamp: msg.messageTimestamp as number,
            pushName: msg.pushName || undefined,
            source: 'whatsapp',
          },
        });

        // Update Chat last message
        await this.service.prismaRepository.chat.upsert({
          where: {
            instanceId_remoteJid: {
              instanceId: this.service.instanceId,
              remoteJid,
            },
          },
          update: {
            ...(msg.pushName ? { name: msg.pushName } : {}),
            lastMessage: msg.message as any,
            lastMessageTimestamp: msg.messageTimestamp as number,
            unreadMessages: fromMe ? 0 : { increment: 1 },
          },
          create: {
            instanceId: this.service.instanceId,
            remoteJid,
            name: msg.pushName || undefined,
            lastMessage: msg.message as any,
            lastMessageTimestamp: msg.messageTimestamp as number,
            unreadMessages: fromMe ? 0 : 1,
          },
        });

        // Webhook
        this.service.sendDataWebhook(Events.MESSAGES_UPSERT, {
          instance: this.service.instance.name,
          message: msg,
        });

        // Chatwoot integration
        if (this.service.configService.get('CHATWOOT').ENABLED && this.service.localChatwoot?.enabled) {
          // Send to chatwoot (handled by other parts or just trigger event)
        }
      }
    },
  };

  public async bindEvents() {
    this.service.client.ev.process(async (events) => {
      if (events['connection.update']) {
        await this.service.connectionUpdate(events['connection.update']);
      }

      if (events['creds.update']) {
        await this.service.instance.authState.saveCreds();
      }

      if (events['messaging-history.set']) {
        const { chats, contacts, messages, isLatest } = events['messaging-history.set'];
        this.service.logger.warn(
          `History sync: ${chats.length} chats, ${contacts.length} contacts, ${messages.length} messages`,
        );

        for (const contact of contacts) {
          const name = contact.name || contact.verifiedName || contact.notify;
          if (!name) continue;
          await this.service.prismaRepository.contact.upsert({
            where: {
              instanceId_remoteJid: {
                instanceId: this.service.instanceId,
                remoteJid: contact.id,
              },
            },
            update: { pushName: name, profilePicUrl: contact.imgUrl || undefined },
            create: {
              instanceId: this.service.instanceId,
              remoteJid: contact.id,
              pushName: name,
              profilePicUrl: contact.imgUrl || undefined,
            },
          });
        }
      }

      if (events['contacts.upsert']) {
        const contacts = events['contacts.upsert'];
        for (const contact of contacts) {
          const name = contact.name || contact.verifiedName || contact.notify;
          await this.service.prismaRepository.contact.upsert({
            where: {
              instanceId_remoteJid: {
                instanceId: this.service.instanceId,
                remoteJid: contact.id,
              },
            },
            update: { pushName: name, profilePicUrl: contact.imgUrl || undefined },
            create: {
              instanceId: this.service.instanceId,
              remoteJid: contact.id,
              pushName: name,
              profilePicUrl: contact.imgUrl || undefined,
            },
          });
        }
      }

      if (events['messages.upsert']) {
        this.service.messageProcessor.processMessage(events['messages.upsert'], this.service.localSettings);
      }

      if (events['messages.update']) {
        for (const { key, update } of events['messages.update']) {
          if (update.status) {
            await this.service.prismaRepository.messageUpdate.create({
              data: {
                instanceId: this.service.instanceId,
                remoteJid: key.remoteJid,
                keyId: key.id,
                messageId: key.id,
                fromMe: key.fromMe || false,
                status: status[update.status],
                dateTime: new Date(),
              },
            });

            this.service.sendDataWebhook(Events.MESSAGES_UPDATE, {
              instance: this.service.instance.name,
              remoteJid: key.remoteJid,
              id: key.id,
              status: status[update.status],
            });
          }
        }
      }

      if (events['chats.upsert']) {
        await this.service.chatHandle['chats.upsert'](events['chats.upsert']);
      }

      if (events['chats.update']) {
        await this.service.chatHandle['chats.update'](events['chats.update']);
      }

      if (events['chats.delete']) {
        await this.service.chatHandle['chats.delete'](events['chats.delete']);
      }

      if (events['presence.update']) {
        const { id, presences } = events['presence.update'];
        this.service.sendDataWebhook(Events.PRESENCE_UPDATE, { remoteJid: id, presences });
      }
    });
  }
}
