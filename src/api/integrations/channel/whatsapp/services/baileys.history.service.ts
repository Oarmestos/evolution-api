import { getContentType } from 'baileys';

export class BaileysHistoryService {
  constructor(private readonly service: any) {}

  public async handleHistorySync(historyData: { chats: any[]; contacts: any[]; messages: any[] }) {
    const { chats, contacts, messages } = historyData;
    this.service.logger.warn(
      `History sync in progress: ${chats.length} chats, ${contacts.length} contacts, ${messages.length} messages`,
    );

    // Helper para guardar mapeo de LID de forma segura
    const saveLidMapping = async (phoneJid: string, lidJid: string) => {
      if (!phoneJid || !lidJid) return;
      const cleanPhoneJid = phoneJid.includes('@') ? phoneJid : `${phoneJid}@s.whatsapp.net`;
      const cleanLid = lidJid.split('@')[0];

      try {
        await (this.service.prismaRepository as any).isOnWhatsapp.upsert({
          where: { remoteJid: cleanPhoneJid },
          update: { lid: cleanLid },
          create: { remoteJid: cleanPhoneJid, lid: cleanLid, jidOptions: '{}' },
        });
        this.service.logger.info(`Successfully mapped LID ${cleanLid} to Phone JID ${cleanPhoneJid}`);
      } catch (err) {
        this.service.logger.error(`Error saving mapping for ${cleanPhoneJid} <-> ${cleanLid}: ${err}`);
      }
    };

    // Fase 0: Descubrimiento Masivo de LIDs
    this.service.logger.warn('Fase 0: Escaneo previo de LIDs e historial de mensajes...');

    // 1. Escaneo preliminar en contactos
    for (const contact of contacts) {
      if (contact.id && contact.id.includes('@s.whatsapp.net') && (contact as any).lid) {
        await saveLidMapping(contact.id, (contact as any).lid);
      }
      if (contact.id && contact.id.includes('@lid') && (contact as any).phone) {
        await saveLidMapping((contact as any).phone, contact.id);
      }
      if (contact.id && contact.id.includes('@lid') && (contact as any).phoneNumber) {
        await saveLidMapping((contact as any).phoneNumber, contact.id);
      }
    }

    // 2. Escaneo preliminar en mensajes históricos
    for (const msg of messages) {
      const remoteJid = msg.key?.remoteJid;
      const senderPn = (msg as any).senderPn;
      if (remoteJid && remoteJid.includes('@lid') && senderPn && senderPn.includes('@s.whatsapp.net')) {
        await saveLidMapping(senderPn, remoteJid);
      }

      const participant = msg.key?.participant || (msg as any).participant;
      const participantPn = (msg as any).participantPn || (msg as any).senderPn;
      if (participant && participant.includes('@lid') && participantPn && participantPn.includes('@s.whatsapp.net')) {
        await saveLidMapping(participantPn, participant);
      }
    }

    // 1. Procesar e importar contactos del historial
    for (const contact of contacts) {
      const name = contact.name || contact.verifiedName || contact.notify;
      if (name) {
        try {
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
        } catch (err) {
          this.service.logger.error(`Error saving historic contact ${contact.id}: ${err}`);
        }
      }

      // Guardar mapeo de LID a base de datos si existe en el objeto contact
      if ((contact as any).lid && contact.id) {
        await saveLidMapping(contact.id, (contact as any).lid);
      }
    }

    // 2. Filtrar y procesar e importar chats históricos
    const activeChats = chats.filter((chat) => {
      const chatCleanJid = chat.id.split('@')[0];
      const hasMessages = messages.some((msg) => {
        const msgJid = msg.key.remoteJid;
        return msgJid && msgJid.split('@')[0] === chatCleanJid;
      });
      const isGroup = chat.id.endsWith('@g.us');
      const hasUnread = chat.unreadCount !== undefined && chat.unreadCount > 0;
      return hasMessages || isGroup || hasUnread;
    });

    for (const chat of activeChats) {
      try {
        await (this.service.prismaRepository as any).chat.upsert({
          where: {
            instanceId_remoteJid: {
              instanceId: this.service.instanceId,
              remoteJid: chat.id,
            },
          },
          update: {
            name: chat.name || undefined,
            unreadMessages: chat.unreadCount !== undefined ? chat.unreadCount : 0,
          },
          create: {
            instanceId: this.service.instanceId,
            remoteJid: chat.id,
            name: chat.name || undefined,
            unreadMessages: chat.unreadCount !== undefined ? chat.unreadCount : 0,
          },
        });
      } catch (chatError) {
        this.service.logger.error(`Error saving historic chat ${chat.id}: ${chatError}`);
      }
    }

    // 3. Procesar e importar mensajes históricos
    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        const remoteJid = msg.key.remoteJid;
        const id = msg.key.id;
        const messageType = getContentType(msg.message);
        if (!messageType) continue;

        const timestamp =
          typeof msg.messageTimestamp === 'number'
            ? msg.messageTimestamp
            : msg.messageTimestamp && typeof msg.messageTimestamp === 'object'
              ? (msg.messageTimestamp as any).toNumber()
              : Math.floor(Date.now() / 1000);

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
            messageTimestamp: timestamp,
          },
          create: {
            instanceId: this.service.instanceId,
            keyId: id,
            key: msg.key as any,
            message: msg.message as any,
            messageType,
            messageTimestamp: timestamp,
            pushName: msg.pushName || undefined,
            source: 'whatsapp',
          },
        });

        // Buscar si este remoteJid telefónico o LID tiene un mapeo en IsOnWhatsapp
        let mapping = null;
        if (remoteJid && remoteJid.includes('@lid')) {
          const cleanLid = remoteJid.split('@')[0];
          mapping = await (this.service.prismaRepository as any).isOnWhatsapp.findFirst({
            where: { lid: cleanLid },
          });
        } else if (remoteJid && remoteJid.includes('@s.whatsapp.net')) {
          mapping = await (this.service.prismaRepository as any).isOnWhatsapp.findFirst({
            where: { remoteJid },
          });
        }

        const chatFilters = [{ remoteJid }];
        if (mapping) {
          const phoneJid = mapping.remoteJid;
          const lidJid = mapping.lid.includes('@lid') ? mapping.lid : `${mapping.lid}@lid`;
          chatFilters.push({ remoteJid: phoneJid });
          chatFilters.push({ remoteJid: lidJid });
        }

        // Actualizar lastMessage en el chat si es más reciente
        await (this.service.prismaRepository as any).chat.updateMany({
          where: {
            instanceId: this.service.instanceId,
            AND: [
              { OR: chatFilters },
              {
                OR: [{ lastMessageTimestamp: null }, { lastMessageTimestamp: { lt: timestamp } }],
              },
            ],
          },
          data: {
            lastMessage: msg.message as any,
            lastMessageTimestamp: timestamp,
          },
        });
      } catch (msgError) {
        this.service.logger.error(`Error saving historic message ${msg.key?.id}: ${msgError}`);
      }
    }

    // 4. Limpieza final de chats huérfanos/vacíos (eliminados en el móvil)
    this.service.logger.warn('Fase 4: Limpiando chats vacíos/eliminados del historial...');
    try {
      await (this.service.prismaRepository as any).chat.deleteMany({
        where: {
          instanceId: this.service.instanceId,
          remoteJid: { not: { endsWith: '@g.us' } }, // Solo chats individuales
          lastMessageTimestamp: null, // Que no tienen ningún timestamp de mensaje asociado
        },
      });
      this.service.logger.info('Successfully cleared empty/deleted historic chats.');
    } catch (cleanupErr) {
      this.service.logger.error(`Error cleaning empty historic chats: ${cleanupErr}`);
    }
  }
}
