import { InstanceDto } from '@api/dto/instance.dto';
import { postgresClient } from '@api/integrations/chatbot/chatwoot/libs/postgres.client';
import { CacheService } from '@api/services/cache.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Chatwoot, ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import ChatwootClient, { ChatwootAPIConfig } from '@figuro/chatwoot-sdk';
import { request as chatwootRequest } from '@figuro/chatwoot-sdk/dist/core/request';
import { Chatwoot as ChatwootModel } from '@prisma/client';

export class ChatwootContactService {
  private readonly logger = new Logger('ChatwootContactService');
  private readonly pgClient = postgresClient.getChatwootConnection();

  constructor(
    private readonly waMonitor: WAMonitoringService,
    private readonly configService: ConfigService,
    private readonly cache: CacheService,
  ) {}

  private async getProvider(instance: InstanceDto): Promise<ChatwootModel | null> {
    const cacheKey = `${instance.instanceName}:getProvider`;
    if (await this.cache.has(cacheKey)) {
      return (await this.cache.get(cacheKey)) as ChatwootModel;
    }

    const provider = await this.waMonitor.waInstances[instance.instanceName]?.findChatwoot();
    if (!provider) {
      this.logger.warn('provider not found');
      return null;
    }

    this.cache.set(cacheKey, provider);
    return provider;
  }

  public async getClientCwConfig(
    instance: InstanceDto,
  ): Promise<(ChatwootAPIConfig & { nameInbox: string; mergeBrazilContacts: boolean }) | null> {
    const provider = await this.getProvider(instance);
    if (!provider) return null;

    return {
      basePath: provider.url,
      with_credentials: true,
      credentials: 'include',
      token: provider.token,
      nameInbox: provider.nameInbox,
      mergeBrazilContacts: provider.mergeBrazilContacts,
    };
  }

  private async clientCw(instance: InstanceDto) {
    const config = await this.getClientCwConfig(instance);
    if (!config) return null;

    return new ChatwootClient({ config });
  }

  public async createContact(
    instance: InstanceDto,
    phoneNumber: string,
    inboxId: number,
    isGroup: boolean,
    name?: string,
    avatar_url?: string,
    jid?: string,
  ) {
    try {
      const client = await this.clientCw(instance);
      const config = await this.getClientCwConfig(instance);
      if (!client || !config) return null;

      const data: any = {
        inbox_id: inboxId,
        name: name || phoneNumber,
        identifier: jid || phoneNumber,
        avatar_url: avatar_url,
      };

      if (!isGroup && ((jid && jid.includes('@')) || !jid)) {
        data['phone_number'] = `+${phoneNumber}`;
      }

      const contact = await client.contacts.create({
        accountId: Number((await this.getProvider(instance))?.accountId),
        data,
      });

      if (!contact) return null;

      const findContact = await this.findContact(instance, phoneNumber);
      if (findContact?.id) {
        await this.addLabelToContact(config.nameInbox, findContact.id);
      }

      return contact;
    } catch (error) {
      if ((error.status === 422 || error.response?.status === 422) && jid) {
        this.logger.warn(`Contact with identifier ${jid} creation failed (422). Checking if it already exists...`);
        const existingContact = await this.findContactByIdentifier(instance, jid);
        if (existingContact) {
          const config = await this.getClientCwConfig(instance);
          await this.addLabelToContact(config.nameInbox, existingContact.id);
          return existingContact;
        }
      }
      this.logger.error({ message: 'Error creating contact', error });
      return null;
    }
  }

  public async updateContact(instance: InstanceDto, id: number, data: any) {
    const client = await this.clientCw(instance);
    if (!client || !id) return null;

    try {
      return await client.contacts.update({
        accountId: Number((await this.getProvider(instance))?.accountId),
        id,
        data,
      });
    } catch {
      return null;
    }
  }

  public async addLabelToContact(nameInbox: string, contactId: number) {
    try {
      const uri = this.configService.get<Chatwoot>('CHATWOOT').IMPORT.DATABASE.CONNECTION.URI;
      if (!uri) return false;

      const sqlTags = `SELECT id, taggings_count FROM tags WHERE name = $1 LIMIT 1`;
      const tagData = (await this.pgClient.query(sqlTags, [nameInbox]))?.rows[0];
      let tagId = tagData?.id;
      const taggingsCount = tagData?.taggings_count || 0;

      const sqlTag = `INSERT INTO tags (name, taggings_count) 
                      VALUES ($1, $2) 
                      ON CONFLICT (name) 
                      DO UPDATE SET taggings_count = tags.taggings_count + 1 
                      RETURNING id`;

      tagId = (await this.pgClient.query(sqlTag, [nameInbox, taggingsCount + 1]))?.rows[0]?.id;

      const sqlCheckTagging = `SELECT 1 FROM taggings 
                               WHERE tag_id = $1 AND taggable_type = 'Contact' AND taggable_id = $2 AND context = 'labels' LIMIT 1`;

      const taggingExists = (await this.pgClient.query(sqlCheckTagging, [tagId, contactId]))?.rowCount > 0;

      if (!taggingExists) {
        const sqlInsertLabel = `INSERT INTO taggings (tag_id, taggable_type, taggable_id, context, created_at) 
                                VALUES ($1, 'Contact', $2, 'labels', NOW())`;

        await this.pgClient.query(sqlInsertLabel, [tagId, contactId]);
      }

      return true;
    } catch {
      return false;
    }
  }

  public async findContactByIdentifier(instance: InstanceDto, identifier: string) {
    const client = await this.clientCw(instance);
    if (!client) return null;

    const contact = (await (client as any).get('contacts/search', {
      params: { q: identifier, sort: 'name' },
    })) as any;

    const payload = contact?.data?.payload || contact?.payload;
    if (payload && payload.length > 0) return payload[0];

    const contactByAttr = (await (client as any).post('contacts/filter', {
      payload: [
        {
          attribute_key: 'identifier',
          filter_operator: 'equal_to',
          values: [identifier],
          query_operator: null,
        },
      ],
    })) as any;

    const filterPayload = contactByAttr?.payload || contactByAttr?.data?.payload;
    if (filterPayload && filterPayload.length > 0) return filterPayload[0];

    return null;
  }

  public async findContact(instance: InstanceDto, phoneNumber: string) {
    const client = await this.clientCw(instance);
    const provider = await this.getProvider(instance);
    const config = await this.getClientCwConfig(instance);
    if (!client || !provider || !config) return null;

    const isGroup = phoneNumber.includes('@g.us');
    const query = isGroup ? phoneNumber : `+${phoneNumber}`;

    let contact: any;
    if (isGroup) {
      contact = await client.contacts.search({
        accountId: Number(provider.accountId),
        q: query,
      });
    } else {
      contact = await chatwootRequest(config, {
        method: 'POST',
        url: `/api/v1/accounts/${provider.accountId}/contacts/filter`,
        body: {
          payload: this.getFilterPayload(phoneNumber),
        },
      });
    }

    if (!contact || contact?.payload?.length === 0) return null;

    if (!isGroup) {
      return contact.payload.length > 1
        ? this.findContactInContactList(contact.payload, phoneNumber)
        : contact.payload[0];
    } else {
      return contact.payload.find((c) => c.identifier === query);
    }
  }

  public async mergeContacts(instance: InstanceDto, baseId: number, mergeId: number) {
    const provider = await this.getProvider(instance);
    const config = await this.getClientCwConfig(instance);
    try {
      return await chatwootRequest(config, {
        method: 'POST',
        url: `/api/v1/accounts/${provider.accountId}/actions/contact_merge`,
        body: {
          base_contact_id: baseId,
          mergee_contact_id: mergeId,
        },
      });
    } catch {
      this.logger.error('Error merging contacts');
      return null;
    }
  }

  private findContactInContactList(contacts: any[], query: string) {
    const phoneNumbers = this.getNumbers(query);
    const phone = phoneNumbers.reduce(
      (savedNumber, number) => (number.length > savedNumber.length ? number : savedNumber),
      '',
    );

    const match = contacts.find((c) => c.phone_number === phone || c.phone_number === phone.replace('+', ''));
    if (match) return match;

    for (const contact of contacts) {
      if (contact.phone_number && phoneNumbers.includes(contact.phone_number.replace('+', ''))) {
        return contact;
      }
    }

    return null;
  }

  private getNumbers(query: string) {
    // Para Colombia (+57), no hay la variaci\u00f3n del 9\u00ba d\u00edgito como en Brasil.
    // Retornamos el n\u00famero limpio.
    return [query.replace('+', '')];
  }

  private getFilterPayload(query: string) {
    const numbers = this.getNumbers(query);
    return numbers.map((num, index) => ({
      attribute_key: 'phone_number',
      filter_operator: 'equal_to',
      values: [num],
      query_operator: index === numbers.length - 1 ? null : 'OR',
    }));
  }
}
