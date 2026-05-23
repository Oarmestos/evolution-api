import {
  ArchiveChatDto,
  DeleteMessage,
  MarkChatUnreadDto,
  MuteChatDto,
  ReadMessageDto,
  UpdateMessageDto,
} from '@api/dto/chat.dto';
import { PrismaRepository, Query } from '@api/repository/repository.service';
import { ConfigService } from '@config/env.config';
import { InternalServerErrorException, NotFoundException } from '@exceptions';
import { Contact as PrismaContact, MessageUpdate } from '@prisma/client';
import { createJid } from '@utils/createJid';

import { BaileysStartupService } from '../whatsapp.baileys.service';

export class BaileysChatService {
  constructor(
    private readonly prismaRepository: PrismaRepository,
    private readonly configService: ConfigService,
  ) {}

  public async muteChat(instance: BaileysStartupService, data: MuteChatDto) {
    try {
      const jid = createJid(data.remoteJid);
      await instance.client.chatModify({ mute: data.muteTime ?? -1 }, jid);
      return { chatId: data.remoteJid, muted: true };
    } catch (error) {
      throw new InternalServerErrorException({
        muted: false,
        message: ['An error occurred while muting the chat.', error.toString()],
      });
    }
  }

  public async deleteChat(instance: BaileysStartupService, remoteJid: string) {
    try {
      const jid = createJid(remoteJid);
      await instance.client.chatModify({ delete: true, lastMessages: [] }, jid);

      await this.prismaRepository.chat.deleteMany({
        where: { instanceId: instance.instanceId, remoteJid: remoteJid },
      });

      await this.prismaRepository.message.deleteMany({
        where: {
          instanceId: instance.instanceId,
          key: {
            path: ['remoteJid'],
            equals: remoteJid,
          },
        },
      });

      return { chatId: remoteJid, deleted: true };
    } catch (error) {
      throw new InternalServerErrorException({
        deleted: false,
        message: ['An error occurred while deleting the chat.', error.toString()],
      });
    }
  }

  public async deleteMessage(instance: BaileysStartupService, del: DeleteMessage) {
    try {
      return await instance.client.sendMessage(del.remoteJid, { delete: del });
    } catch (error) {
      throw new InternalServerErrorException('Error deleteMessage', error.toString());
    }
  }

  public async markMessageAsRead(instance: BaileysStartupService, data: ReadMessageDto) {
    try {
      for (const key of data.readMessages) {
        await instance.client.readMessages([key]);
      }
      return { message: 'Messages read' };
    } catch (error) {
      throw new InternalServerErrorException('Error markMessageAsRead', error.toString());
    }
  }

  public async archiveChat(instance: BaileysStartupService, data: ArchiveChatDto) {
    try {
      const jid = createJid(data.chat);
      await instance.client.chatModify({ archive: data.archive, lastMessages: [data.lastMessage] }, jid);
      return { message: 'Chat archived' };
    } catch (error) {
      throw new InternalServerErrorException('Error archiveChat', error.toString());
    }
  }

  public async markChatUnread(instance: BaileysStartupService, data: MarkChatUnreadDto) {
    try {
      const jid = createJid(data.chat);
      await instance.client.chatModify({ markRead: false, lastMessages: [data.lastMessage] }, jid);
      return { message: 'Chat marked as unread' };
    } catch (error) {
      throw new InternalServerErrorException('Error markChatUnread', error.toString());
    }
  }

  public async updateMessage(instance: BaileysStartupService, data: UpdateMessageDto) {
    try {
      const jid = createJid(data.number);
      return await instance.client.sendMessage(jid, { edit: data.key, text: data.text });
    } catch (error) {
      throw new InternalServerErrorException('Error updateMessage', error.toString());
    }
  }

  public async fetchContacts(instance: BaileysStartupService, query: Query<PrismaContact>) {
    const where = { instanceId: instance.instanceId, remoteJid: query?.where?.remoteJid };
    const contacts = await this.prismaRepository.contact.findMany({
      where,
      orderBy: { pushName: 'asc' },
      skip: (query.offset || 50) * ((query?.page || 1) === 1 ? 0 : (query?.page as number) - 1),
      take: query.offset || 50,
    });

    return contacts.map((contact) => ({
      ...contact,
      isGroup: contact.remoteJid.endsWith('@g.us'),
      isSaved: !!contact.pushName || !!contact.profilePicUrl,
      type: contact.remoteJid.endsWith('@g.us') ? 'group' : contact.pushName ? 'contact' : 'group_member',
    }));
  }

  public async fetchChats(instance: BaileysStartupService, query: Query<PrismaContact>) {
    if (!query?.offset) query.offset = 50;
    if (!query?.page) query.page = 1;

    const chats = await this.prismaRepository.chat.findMany({
      where: { instanceId: instance.instanceId, remoteJid: query?.where?.remoteJid },
      orderBy: { lastMessageTimestamp: 'desc' },
      skip: query.offset * (query?.page === 1 ? 0 : (query?.page as number) - 1),
      take: query.offset,
    });

    const contactJids = chats.map((c) => c.remoteJid);

    // Resolver mapeos de LID a Phone JID dinámicamente
    const lids = contactJids.filter((jid) => jid.includes('@lid'));
    const cleanLids = lids.map((jid) => jid.split('@')[0]);

    const mappings = await (this.prismaRepository as any).isOnWhatsapp.findMany({
      where: {
        OR: [{ lid: { in: cleanLids } }, { lid: { in: lids } }],
      },
    });

    const jidMap = new Map<string, string>();
    mappings.forEach((m) => {
      if (m.lid) {
        jidMap.set(m.lid, m.remoteJid);
        if (!m.lid.includes('@lid')) {
          jidMap.set(`${m.lid}@lid`, m.remoteJid);
        }
      }
    });

    const searchJids = [...contactJids];
    contactJids.forEach((jid) => {
      const mapped = jidMap.get(jid);
      if (mapped) searchJids.push(mapped);
    });

    const contacts = await this.prismaRepository.contact.findMany({
      where: {
        instanceId: instance.instanceId,
        remoteJid: { in: searchJids },
      },
    });

    return chats.map((chat) => {
      let contact = contacts.find((c) => c.remoteJid === chat.remoteJid);
      if (!contact) {
        const mappedJid = jidMap.get(chat.remoteJid);
        if (mappedJid) {
          contact = contacts.find((c) => c.remoteJid === mappedJid);
        }
      }

      let phoneNumber = contact?.phoneNumber;
      if (!phoneNumber && contact?.remoteJid && contact.remoteJid.endsWith('@s.whatsapp.net')) {
        phoneNumber = contact.remoteJid.split('@')[0];
      }
      if (!phoneNumber) {
        phoneNumber = chat.remoteJid.split('@')[0];
      }

      const isLid = chat.remoteJid.includes('@lid');
      let fallbackName = chat.remoteJid.split('@')[0];
      if (isLid && phoneNumber && phoneNumber !== fallbackName) {
        fallbackName = `+${phoneNumber}`;
      }

      return {
        id: contact?.id || null,
        remoteJid: chat.remoteJid,
        pushName: contact?.pushName || chat.name || fallbackName,
        profilePicUrl: contact?.profilePicUrl,
        updatedAt: chat.updatedAt,
        windowStart: chat.createdAt,
        windowExpires: new Date(chat.createdAt.getTime() + 24 * 60 * 60 * 1000),
        windowActive: new Date(chat.createdAt.getTime() + 24 * 60 * 60 * 1000) > new Date(),
        lastMessage: chat.lastMessage ? instance.cleanMessageData(chat.lastMessage) : undefined,
        unreadCount: chat.unreadMessages,
        controlMode: chat.controlMode,
        phoneNumber,
        email: contact?.email || null,
        isSaved: !!contact?.id,
      };
    });
  }

  public async fetchStatusMessage(instance: BaileysStartupService, query: Query<MessageUpdate>) {
    if (!query?.offset) query.offset = 50;
    if (!query?.page) query.page = 1;

    return await this.prismaRepository.messageUpdate.findMany({
      where: { instanceId: instance.instanceId, messageId: query?.where?.messageId },
      orderBy: { dateTime: 'desc' },
      skip: query.offset * (query?.page === 1 ? 0 : (query?.page as number) - 1),
      take: query.offset,
    });
  }

  public async fetchInternalNotes(instance: BaileysStartupService, remoteJid: string) {
    return await this.prismaRepository.internalNote.findMany({
      where: {
        instanceId: instance.instanceId,
        remoteJid,
      },
      include: {
        User: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async createInternalNote(instance: BaileysStartupService, remoteJid: string, content: string, userId: string) {
    const chat = await instance.findChatByRemoteJid(remoteJid);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return await this.prismaRepository.internalNote.create({
      data: {
        instanceId: instance.instanceId,
        remoteJid,
        content,
        userId,
        chatId: chat.id,
      },
      include: {
        User: true,
      },
    });
  }

  public async updateControlMode(instance: BaileysStartupService, remoteJid: string, mode: 'AI' | 'HUMAN') {
    return await this.prismaRepository.chat.update({
      where: {
        instanceId_remoteJid: {
          instanceId: instance.instanceId,
          remoteJid,
        },
      },
      data: { controlMode: mode },
    });
  }

  public async findChatByRemoteJid(instance: BaileysStartupService, remoteJid: string) {
    const chat = await this.prismaRepository.chat.findUnique({
      where: {
        instanceId_remoteJid: {
          instanceId: instance.instanceId,
          remoteJid,
        },
      },
    });

    if (!chat) return null;

    // Resolver LID a JID telefónico dinámicamente si aplica
    const searchJids = [remoteJid];
    if (remoteJid.includes('@lid')) {
      const cleanLid = remoteJid.split('@')[0];
      const mapping = await (this.prismaRepository as any).isOnWhatsapp.findFirst({
        where: {
          OR: [{ lid: cleanLid }, { lid: remoteJid }],
        },
      });
      if (mapping) {
        searchJids.push(mapping.remoteJid);
      }
    }

    const contact = await this.prismaRepository.contact.findFirst({
      where: {
        instanceId: instance.instanceId,
        remoteJid: { in: searchJids },
      },
    });

    let phoneNumber = contact?.phoneNumber;
    if (!phoneNumber && contact?.remoteJid && contact.remoteJid.endsWith('@s.whatsapp.net')) {
      phoneNumber = contact.remoteJid.split('@')[0];
    }
    if (!phoneNumber) {
      phoneNumber = remoteJid.split('@')[0];
    }

    const isLid = remoteJid.includes('@lid');
    let fallbackName = remoteJid.split('@')[0];
    if (isLid && phoneNumber && phoneNumber !== fallbackName) {
      fallbackName = `+${phoneNumber}`;
    }

    return {
      ...chat,
      pushName: contact?.pushName || chat.name || fallbackName,
      profilePicUrl: contact?.profilePicUrl,
      phoneNumber,
      email: contact?.email || null,
    };
  }

  public async fetchMessages(instance: BaileysStartupService, query: any) {
    const keyFilters = query?.where?.key;
    const timestampFilter = {};

    if (query?.where?.messageTimestamp) {
      if (query.where.messageTimestamp['gte'] && query.where.messageTimestamp['lte']) {
        timestampFilter['messageTimestamp'] = {
          gte: Math.floor(new Date(query.where.messageTimestamp['gte']).getTime() / 1000),
          lte: Math.floor(new Date(query.where.messageTimestamp['lte']).getTime() / 1000),
        };
      }
    }

    // Resolver LID a JID telefónico dinámicamente si aplica
    let remoteJidAlt = undefined;
    if (keyFilters?.remoteJid && keyFilters.remoteJid.includes('@lid')) {
      const cleanLid = keyFilters.remoteJid.split('@')[0];
      const mapping = await (this.prismaRepository as any).isOnWhatsapp.findFirst({
        where: {
          OR: [{ lid: cleanLid }, { lid: keyFilters.remoteJid }],
        },
      });
      if (mapping) {
        remoteJidAlt = mapping.remoteJid;
      }
    }

    const count = await this.prismaRepository.message.count({
      where: {
        instanceId: instance.instanceId,
        id: query?.where?.id,
        source: query?.where?.source,
        messageType: query?.where?.messageType,
        ...timestampFilter,
        AND: [
          keyFilters?.id ? { key: { path: ['id'], equals: keyFilters?.id } } : {},
          keyFilters?.fromMe ? { key: { path: ['fromMe'], equals: keyFilters?.fromMe } } : {},
          keyFilters?.participant ? { key: { path: ['participant'], equals: keyFilters?.participant } } : {},
          {
            OR: [
              keyFilters?.remoteJid ? { key: { path: ['remoteJid'], equals: keyFilters?.remoteJid } } : {},
              remoteJidAlt ? { key: { path: ['remoteJid'], equals: remoteJidAlt } } : {},
              keyFilters?.remoteJidAlt ? { key: { path: ['remoteJidAlt'], equals: keyFilters?.remoteJidAlt } } : {},
            ],
          },
        ],
      },
    });

    if (!query?.offset) query.offset = 50;
    if (!query?.page) query.page = 1;

    const messages = await this.prismaRepository.message.findMany({
      where: {
        instanceId: instance.instanceId,
        id: query?.where?.id,
        source: query?.where?.source,
        messageType: query?.where?.messageType,
        ...timestampFilter,
        AND: [
          keyFilters?.id ? { key: { path: ['id'], equals: keyFilters?.id } } : {},
          keyFilters?.fromMe ? { key: { path: ['fromMe'], equals: keyFilters?.fromMe } } : {},
          keyFilters?.participant ? { key: { path: ['participant'], equals: keyFilters?.participant } } : {},
          {
            OR: [
              keyFilters?.remoteJid ? { key: { path: ['remoteJid'], equals: keyFilters?.remoteJid } } : {},
              remoteJidAlt ? { key: { path: ['remoteJid'], equals: remoteJidAlt } } : {},
              keyFilters?.remoteJidAlt ? { key: { path: ['remoteJidAlt'], equals: keyFilters?.remoteJidAlt } } : {},
            ],
          },
        ],
      },
      orderBy: { messageTimestamp: 'desc' },
      skip: query.offset * (query?.page === 1 ? 0 : (query?.page as number) - 1),
      take: query.offset,
      select: {
        id: true,
        key: true,
        pushName: true,
        messageType: true,
        message: true,
        messageTimestamp: true,
        instanceId: true,
        source: true,
        contextInfo: true,
        MessageUpdate: { select: { status: true } },
      },
    });

    const formattedMessages = messages.map((message) => {
      const messageKey = message.key as any;
      if (!message.pushName) {
        if (messageKey.fromMe) {
          message.pushName = 'Me';
        } else if (message.contextInfo) {
          const ci = message.contextInfo as any;
          if (ci.participant) {
            message.pushName = ci.participant.split('@')[0];
          } else if (messageKey.participant) {
            message.pushName = messageKey.participant.split('@')[0];
          }
        }
      }
      return message;
    });

    return {
      messages: {
        total: count,
        pages: Math.ceil(count / query.offset),
        currentPage: query.page,
        records: formattedMessages,
      },
    };
  }
}
