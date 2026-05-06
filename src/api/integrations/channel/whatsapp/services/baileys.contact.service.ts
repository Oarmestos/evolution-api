import { OnWhatsAppDto, WhatsAppNumberDto } from '@api/dto/chat.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { BadRequestException, InternalServerErrorException } from '@exceptions';
import { createJid } from '@utils/createJid';
import { getOnWhatsappCache, saveOnWhatsappCache } from '@utils/onWhatsappCache';
import { isJidGroup } from 'baileys';

import { BaileysStartupService } from '../whatsapp.baileys.service';

export class BaileysContactService {
  private readonly logger = new Logger(BaileysContactService.name);

  constructor(
    private readonly prismaRepository: PrismaRepository,
    private readonly configService: ConfigService,
  ) {}

  public async whatsappNumber(instance: BaileysStartupService, data: WhatsAppNumberDto) {
    const jids: {
      groups: { number: string; jid: string }[];
      broadcast: { number: string; jid: string }[];
      users: { number: string; jid: string; name?: string }[];
    } = { groups: [], broadcast: [], users: [] };

    data.numbers.forEach((number) => {
      const jid = createJid(number);

      if (isJidGroup(jid)) {
        jids.groups.push({ number, jid });
      } else if (jid === 'status@broadcast') {
        jids.broadcast.push({ number, jid });
      } else {
        jids.users.push({ number, jid });
      }
    });

    const onWhatsapp: OnWhatsAppDto[] = [];

    // BROADCAST
    onWhatsapp.push(...jids.broadcast.map(({ jid, number }) => new OnWhatsAppDto(jid, false, number)));

    // GROUPS
    const groups = await Promise.all(
      jids.groups.map(async ({ jid, number }) => {
        const group = await instance.findGroup({ groupJid: jid }, 'inner');

        if (!group) {
          return new OnWhatsAppDto(jid, false, number);
        }

        return new OnWhatsAppDto(group.id, true, number, group?.subject);
      }),
    );
    onWhatsapp.push(...groups);

    // USERS
    const contacts: any[] = await this.prismaRepository.contact.findMany({
      where: { instanceId: instance.instanceId, remoteJid: { in: jids.users.map(({ jid }) => jid) } },
    });

    // Unified cache verification for all numbers
    const numbersToVerify = jids.users.map(({ jid }) => jid.replace('+', ''));

    // Get all numbers from cache
    const cachedNumbers = await getOnWhatsappCache(numbersToVerify);

    // Separate numbers that are and are not in cache
    const cachedJids = new Set(cachedNumbers.flatMap((cached) => cached.jidOptions));
    const numbersNotInCache = numbersToVerify.filter((jid) => !cachedJids.has(jid));

    // Only call Baileys for numbers that are not in cache
    let verify: { jid: string; exists: boolean }[] = [];
    const normalNumbersNotInCache = numbersNotInCache.filter((jid) => !jid.includes('@lid'));

    if (normalNumbersNotInCache.length > 0) {
      this.logger.verbose(`Checking ${normalNumbersNotInCache.length} numbers via Baileys (not found in cache)`);
      verify = await instance.client.onWhatsApp(...normalNumbersNotInCache);

      // Save results to cache
      if (verify.length > 0) {
        await saveOnWhatsappCache(verify.map((v) => ({ remoteJid: v.jid, exists: v.exists })));
      }
    }

    const verifiedUsers = await Promise.all(
      jids.users.map(async (user) => {
        // Try to get from cache first
        const cached = cachedNumbers.find((cached) => cached.jidOptions.includes(user.jid.replace('+', '')));

        if (cached) {
          return new OnWhatsAppDto(
            cached.remoteJid,
            true,
            user.number,
            contacts.find((c) => c.remoteJid === cached.remoteJid)?.pushName,
            cached.lid || (cached.remoteJid.includes('@lid') ? 'lid' : undefined),
          );
        }

        // If it's a LID number and not in cache, consider it valid (common pattern in newer Baileys)
        if (user.jid.includes('@lid')) {
          return new OnWhatsAppDto(
            user.jid,
            true,
            user.number,
            contacts.find((c) => c.remoteJid === user.jid)?.pushName,
            'lid',
          );
        }

        // Check if verified in current call
        const v = verify.find((v) => v.jid === user.jid || v.jid.split('@')[0] === user.number);
        if (v) {
          return new OnWhatsAppDto(v.jid, v.exists, user.number, contacts.find((c) => c.remoteJid === v.jid)?.pushName);
        }

        // Fallback (number doesn't exist or verification failed)
        return new OnWhatsAppDto(user.jid, false, user.number);
      }),
    );

    onWhatsapp.push(...verifiedUsers);

    return onWhatsapp;
  }

  public async profilePicture(instance: BaileysStartupService, jid: string) {
    try {
      const profilePictureUrl = await instance.client.profilePictureUrl(jid, 'image');
      return { profilePictureUrl };
    } catch {
      return { profilePictureUrl: null };
    }
  }

  public async getStatus(instance: BaileysStartupService, jid: string) {
    try {
      const status = await instance.client.fetchStatus(jid);
      return { status: status[0]?.status };
    } catch {
      return { status: null };
    }
  }

  public async fetchProfile(instance: BaileysStartupService, number: string) {
    const jid = createJid(number);

    try {
      const onWhatsapp = (await this.whatsappNumber(instance, { numbers: [jid] }))?.shift();

      if (!onWhatsapp.exists) {
        throw new BadRequestException(onWhatsapp);
      }

      const info = onWhatsapp;
      const picture = await this.profilePicture(instance, info?.jid);
      const status = await this.getStatus(instance, info?.jid);
      const business = await instance.fetchBusinessProfile(info?.jid);

      return {
        wuid: info?.jid || jid,
        name: info?.name,
        numberExists: info?.exists,
        profilePicUrl: picture.profilePictureUrl,
        status: status.status,
        isBusiness: business.isBusiness,
        businessProfile: business.isBusiness ? business : null,
      };
    } catch (error) {
      this.logger.error(error);
      return { wuid: jid, name: null, isBusiness: false };
    }
  }

  public async sendPresence(instance: BaileysStartupService, data: any) {
    try {
      const { number } = data;
      const isWA = (await this.whatsappNumber(instance, { numbers: [number] }))?.shift();

      if (!isWA.exists && !isJidGroup(isWA.jid) && !isWA.jid.includes('@broadcast')) {
        throw new BadRequestException(isWA);
      }

      const sender = isWA.jid;

      if (data?.delay && data?.delay > 20000) {
        let remainingDelay = data?.delay;
        while (remainingDelay > 20000) {
          await instance.client.presenceSubscribe(sender);
          await instance.client.sendPresenceUpdate(data?.presence ?? 'composing', sender);
          await new Promise((resolve) => setTimeout(resolve, 20000));
          await instance.client.sendPresenceUpdate('paused', sender);
          remainingDelay -= 20000;
        }
        if (remainingDelay > 0) {
          await instance.client.presenceSubscribe(sender);
          await instance.client.sendPresenceUpdate(data?.presence ?? 'composing', sender);
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
          await instance.client.sendPresenceUpdate('paused', sender);
        }
      } else {
        await instance.client.presenceSubscribe(sender);
        await instance.client.sendPresenceUpdate(data?.presence ?? 'composing', sender);
        if (data?.delay) await new Promise((resolve) => setTimeout(resolve, data.delay));
        await instance.client.sendPresenceUpdate('paused', sender);
      }

      return { presence: data.presence };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.toString());
    }
  }

  public async setPresence(instance: BaileysStartupService, data: any) {
    try {
      await instance.client.sendPresenceUpdate(data.presence);
      return { presence: data.presence };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.toString());
    }
  }

  public async updateProfileName(instance: BaileysStartupService, name: string) {
    try {
      await instance.client.updateProfileName(name);
      return { message: 'Profile name updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error updateProfileName', error.toString());
    }
  }

  public async updateProfileStatus(instance: BaileysStartupService, status: string) {
    try {
      await instance.client.updateProfileStatus(status);
      return { message: 'Profile status updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error updateProfileStatus', error.toString());
    }
  }

  public async updateProfilePicture(instance: BaileysStartupService, picture: string) {
    try {
      const jid = instance.instance.wuid;
      await instance.client.updateProfilePicture(jid, { url: picture });
      return { message: 'Profile picture updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error updateProfilePicture', error.toString());
    }
  }

  public async removeProfilePicture(instance: BaileysStartupService) {
    try {
      const jid = instance.instance.wuid;
      await instance.client.removeProfilePicture(jid);
      return { message: 'Profile picture removed' };
    } catch (error) {
      throw new InternalServerErrorException('Error removeProfilePicture', error.toString());
    }
  }

  public async fetchPrivacySettings(instance: BaileysStartupService) {
    try {
      return await instance.client.fetchPrivacySettings();
    } catch (error) {
      throw new InternalServerErrorException('Error fetchPrivacySettings', error.toString());
    }
  }

  public async updatePrivacySettings(instance: BaileysStartupService, data: any) {
    try {
      if (data.last) await instance.client.updateLastSeenPrivacy(data.last);
      if (data.online) await instance.client.updateOnlinePrivacy(data.online);
      if (data.profile) await instance.client.updateProfilePicturePrivacy(data.profile);
      if (data.status) await instance.client.updateStatusPrivacy(data.status);
      if (data.readreceipts) await instance.client.updateReadReceiptsPrivacy(data.readreceipts);
      if (data.groupadd) await instance.client.updateGroupsAddPrivacy(data.groupadd);

      return { message: 'Privacy settings updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error updatePrivacySettings', error.toString());
    }
  }

  public async blockUser(instance: BaileysStartupService, data: any) {
    try {
      const jid = createJid(data.number);
      await instance.client.updateBlockStatus(jid, data.status);
      return { message: 'User updated' };
    } catch (error) {
      throw new InternalServerErrorException('Error blockUser', error.toString());
    }
  }

  public async updateContact(
    instance: BaileysStartupService,
    remoteJid: string,
    data: { pushName?: string; phoneNumber?: string; email?: string },
  ) {
    const contact = await this.prismaRepository.contact.upsert({
      where: {
        instanceId_remoteJid: {
          instanceId: instance.instanceId,
          remoteJid,
        },
      },
      update: data,
      create: {
        instanceId: instance.instanceId,
        remoteJid,
        ...data,
      },
    });

    if (data.pushName) {
      await this.prismaRepository.chat.update({
        where: {
          instanceId_remoteJid: {
            instanceId: instance.instanceId,
            remoteJid,
          },
        },
        data: { name: data.pushName },
      });
    }

    return contact;
  }
}
