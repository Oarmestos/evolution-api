import { InstanceDto } from '@api/dto/instance.dto';
import { CacheService } from '@api/services/cache.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import ChatwootClient, { conversation, inbox } from '@figuro/chatwoot-sdk';
import { Chatwoot as ChatwootModel } from '@prisma/client';

import { ChatwootContactService } from './chatwoot.contact.service';

export class ChatwootConversationService {
  private readonly logger = new Logger('ChatwootConversationService');
  private readonly LOCK_POLLING_DELAY_MS = 300;

  constructor(
    private readonly waMonitor: WAMonitoringService,
    private readonly configService: ConfigService,
    private readonly cache: CacheService,
    private readonly contactService: ChatwootContactService,
  ) {}

  private async getProvider(instance: InstanceDto): Promise<ChatwootModel | null> {
    const cacheKey = `${instance.instanceName}:getProvider`;
    if (await this.cache.has(cacheKey)) {
      return (await this.cache.get(cacheKey)) as ChatwootModel;
    }

    const provider = await this.waMonitor.waInstances[instance.instanceName]?.findChatwoot();
    if (!provider) return null;

    this.cache.set(cacheKey, provider);
    return provider;
  }

  private async clientCw(instance: InstanceDto) {
    const config = await this.contactService.getClientCwConfig(instance);
    if (!config) return null;
    return new ChatwootClient({ config });
  }

  public async getInbox(instance: InstanceDto): Promise<inbox | null> {
    const cacheKey = `${instance.instanceName}:getInbox`;
    if (await this.cache.has(cacheKey)) {
      return (await this.cache.get(cacheKey)) as inbox;
    }

    const client = await this.clientCw(instance);
    const provider = await this.getProvider(instance);
    const config = await this.contactService.getClientCwConfig(instance);
    if (!client || !provider || !config) return null;

    const inboxes = (await client.inboxes.list({ accountId: Number(provider.accountId) })) as any;
    const findByName = inboxes?.payload?.find((i: any) => i.name === config.nameInbox);

    if (!findByName) return null;

    this.cache.set(cacheKey, findByName);
    return findByName;
  }

  public async createConversation(instance: InstanceDto, body: any): Promise<number | null> {
    const isLid = body.key.addressingMode === 'lid';
    const isGroup = body.key.remoteJid.endsWith('@g.us');
    const phoneNumber = isLid && !isGroup ? body.key.remoteJidAlt : body.key.remoteJid;
    const { remoteJid } = body.key;
    const cacheKey = `${instance.instanceName}:createConversation-${remoteJid}`;
    const lockKey = `${instance.instanceName}:lock:createConversation-${remoteJid}`;
    const maxWaitTime = 5000;

    const client = await this.clientCw(instance);
    const provider = await this.getProvider(instance);
    if (!client || !provider) return null;

    try {
      // Identifier update logic
      if (phoneNumber && remoteJid && !isGroup) {
        const contact = await this.contactService.findContact(instance, phoneNumber.split('@')[0]);
        if (contact && contact.identifier !== remoteJid) {
          await this.contactService.updateContact(instance, contact.id, {
            identifier: phoneNumber,
            phone_number: `+${phoneNumber.split('@')[0]}`,
          });
        }
      }

      if (await this.cache.has(cacheKey)) {
        const conversationId = (await this.cache.get(cacheKey)) as number;
        try {
          const exists = await client.conversations.get({ accountId: Number(provider.accountId), conversationId });
          if (exists) return conversationId;
        } catch {
          this.cache.delete(cacheKey);
        }
      }

      if (await this.cache.has(lockKey)) {
        const start = Date.now();
        while (await this.cache.has(lockKey)) {
          if (Date.now() - start > maxWaitTime) break;
          await new Promise((res) => setTimeout(res, this.LOCK_POLLING_DELAY_MS));
          if (await this.cache.has(cacheKey)) return (await this.cache.get(cacheKey)) as number;
        }
      }

      await this.cache.set(lockKey, true, 30);

      try {
        if (await this.cache.has(cacheKey)) return (await this.cache.get(cacheKey)) as number;

        const chatId = isGroup ? remoteJid : phoneNumber.split('@')[0].split(':')[0];
        let nameContact = !body.key.fromMe ? body.pushName : chatId;
        const filterInbox = await this.getInbox(instance);
        if (!filterInbox) return null;

        if (isGroup) {
          const group = await this.waMonitor.waInstances[instance.instanceName].client.groupMetadata(chatId);
          const participantJid = isLid && !body.key.fromMe ? body.key.participantAlt : body.key.participant;
          nameContact = `${group.subject} (GROUP)`;

          const picture = await this.waMonitor.waInstances[instance.instanceName].profilePicture(
            participantJid.split('@')[0],
          );
          const findParticipant = await this.contactService.findContact(instance, participantJid.split('@')[0]);

          if (findParticipant) {
            if (!findParticipant.name || findParticipant.name === chatId) {
              await this.contactService.updateContact(instance, findParticipant.id, {
                name: body.pushName,
                avatar_url: picture.profilePictureUrl || null,
              });
            }
          } else {
            await this.contactService.createContact(
              instance,
              participantJid.split('@')[0].split(':')[0],
              filterInbox.id,
              false,
              body.pushName,
              picture.profilePictureUrl || null,
              participantJid,
            );
          }
        }

        const picture = await this.waMonitor.waInstances[instance.instanceName].profilePicture(chatId);
        let contact = await this.contactService.findContact(instance, chatId);

        if (contact) {
          if (!body.key.fromMe) {
            const waPic = picture?.profilePictureUrl?.split(/[#?]/)[0].split('/').pop() || '';
            const cwPic = contact?.thumbnail?.split(/[#?]/)[0].split('/').pop() || '';
            const picNeedsUpdate = waPic !== cwPic;
            const nameNeedsUpdate = !contact.name || contact.name === chatId;

            if (picNeedsUpdate || nameNeedsUpdate) {
              contact = await this.contactService.updateContact(instance, contact.id, {
                ...(nameNeedsUpdate && { name: nameContact }),
                ...(waPic === '' && { avatar: null }),
                ...(picNeedsUpdate && { avatar_url: picture?.profilePictureUrl }),
              });
            }
          }
        } else {
          contact = await this.contactService.createContact(
            instance,
            chatId,
            filterInbox.id,
            isGroup,
            nameContact,
            picture.profilePictureUrl || null,
            phoneNumber,
          );
        }

        if (!contact) return null;

        const contactId = contact?.payload?.id || contact?.payload?.contact?.id || contact?.id;
        const conversations = (await client.contacts.listConversations({
          accountId: Number(provider.accountId),
          id: contactId,
        })) as any;

        let inboxConversation = conversations?.payload?.find((c: any) => c.inbox_id == filterInbox.id);

        if (inboxConversation) {
          if (provider.reopenConversation) {
            if (provider.conversationPending && inboxConversation.status !== 'open') {
              await client.conversations.toggleStatus({
                accountId: Number(provider.accountId),
                conversationId: inboxConversation.id,
                data: { status: 'pending' },
              });
            }
          } else {
            inboxConversation = conversations.payload.find(
              (c: any) => c && c.status !== 'resolved' && c.inbox_id == filterInbox.id,
            );
          }

          if (inboxConversation) {
            this.cache.set(cacheKey, inboxConversation.id, 1800);
            return inboxConversation.id;
          }
        }

        const data: any = { contact_id: contactId.toString(), inbox_id: filterInbox.id.toString() };
        if (provider.conversationPending) data['status'] = 'pending';

        const conversation = await client.conversations.create({ accountId: Number(provider.accountId), data });
        if (!conversation) return null;

        this.cache.set(cacheKey, conversation.id, 1800);
        return conversation.id;
      } finally {
        await this.cache.delete(lockKey);
      }
    } catch (error) {
      this.logger.error(`Error in createConversation: ${error}`);
      return null;
    }
  }

  public async getOpenConversationByContact(
    instance: InstanceDto,
    inbox: inbox,
    contact: any,
  ): Promise<conversation | null> {
    const client = await this.clientCw(instance);
    const provider = await this.getProvider(instance);
    if (!client || !provider) return null;

    const conversations = (await client.contacts.listConversations({
      accountId: Number(provider.accountId),
      id: contact.id,
    })) as any;
    return conversations?.payload?.find((c: any) => c.inbox_id === inbox.id && c.status === 'open') || null;
  }
}
