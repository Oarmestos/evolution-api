import {
  AcceptGroupInvite,
  CreateGroupDto,
  GetParticipant,
  GroupDescriptionDto,
  GroupInvite,
  GroupJid,
  GroupPictureDto,
  GroupSendInvite,
  GroupSubjectDto,
  GroupToggleEphemeralDto,
  GroupUpdateParticipantDto,
  GroupUpdateSettingDto,
} from '@api/dto/group.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@exceptions';
import { createJid } from '@utils/createJid';
import { makeProxyAgent } from '@utils/makeProxyAgent';
import { saveOnWhatsappCache } from '@utils/onWhatsappCache';
import axios from 'axios';
import { WAMediaUpload } from 'baileys';
import { isBase64, isURL } from 'class-validator';

import { BaileysStartupService } from '../whatsapp.baileys.service';

export class BaileysGroupService {
  private readonly logger = new Logger(BaileysGroupService.name);

  constructor(
    private readonly prismaRepository: PrismaRepository,
    private readonly configService: ConfigService,
  ) {}

  public async createGroup(instance: BaileysStartupService, create: CreateGroupDto) {
    try {
      const participants = (await instance.whatsappNumber({ numbers: create.participants }))
        .filter((participant) => participant.exists)
        .map((participant) => participant.jid);
      const { id } = await instance.client.groupCreate(create.subject, participants);

      if (create?.description) {
        await instance.client.groupUpdateDescription(id, create.description);
      }

      if (create?.promoteParticipants) {
        await this.updateGParticipant(instance, { groupJid: id, action: 'promote', participants: participants });
      }

      const group = await instance.client.groupMetadata(id);

      return group;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error creating group', error.toString());
    }
  }

  public async updateGroupPicture(instance: BaileysStartupService, picture: GroupPictureDto) {
    try {
      let pic: WAMediaUpload;
      if (isURL(picture.image)) {
        const timestamp = new Date().getTime();
        const parsedURL = new URL(picture.image);
        parsedURL.searchParams.set('timestamp', timestamp.toString());
        const url = parsedURL.toString();

        let config: any = { responseType: 'arraybuffer' };

        const proxy = instance['localProxy'];
        if (proxy?.enabled) {
          config = {
            ...config,
            httpsAgent: makeProxyAgent({
              host: proxy.host,
              port: proxy.port,
              protocol: proxy.protocol,
              username: proxy.username,
              password: proxy.password,
            }),
          };
        }

        pic = (await axios.get(url, config)).data;
      } else if (isBase64(picture.image)) {
        pic = Buffer.from(picture.image, 'base64');
      } else {
        throw new BadRequestException('"profilePicture" must be a url or a base64');
      }
      await instance.client.updateProfilePicture(picture.groupJid, pic);

      return { update: 'success' };
    } catch (error) {
      throw new InternalServerErrorException('Error update group picture', error.toString());
    }
  }

  public async updateGroupSubject(instance: BaileysStartupService, data: GroupSubjectDto) {
    try {
      await instance.client.groupUpdateSubject(data.groupJid, data.subject);

      return { update: 'success' };
    } catch (error) {
      throw new InternalServerErrorException('Error updating group subject', error.toString());
    }
  }

  public async updateGroupDescription(instance: BaileysStartupService, data: GroupDescriptionDto) {
    try {
      await instance.client.groupUpdateDescription(data.groupJid, data.description);

      return { update: 'success' };
    } catch (error) {
      throw new InternalServerErrorException('Error updating group description', error.toString());
    }
  }

  public async findGroup(instance: BaileysStartupService, id: GroupJid, reply: 'inner' | 'out' = 'out') {
    try {
      const group = await instance.client.groupMetadata(id.groupJid);

      if (!group) {
        this.logger.error('Group not found');
        return null;
      }

      const picture = await instance.profilePicture(group.id);

      return {
        id: group.id,
        subject: group.subject,
        subjectOwner: group.subjectOwner,
        subjectTime: group.subjectTime,
        pictureUrl: picture.profilePictureUrl,
        size: group.participants.length,
        creation: group.creation,
        owner: group.owner,
        desc: group.desc,
        descId: group.descId,
        restrict: group.restrict,
        announce: group.announce,
        participants: group.participants,
        isCommunity: group.isCommunity,
        isCommunityAnnounce: group.isCommunityAnnounce,
        linkedParent: group.linkedParent,
      };
    } catch (error) {
      if (reply === 'inner') {
        return;
      }
      throw new NotFoundException('Error fetching group', error.toString());
    }
  }

  public async fetchAllGroups(instance: BaileysStartupService, getParticipants: GetParticipant) {
    const fetch = Object.values(await instance.client.groupFetchAllParticipating());

    const groups = [];
    for (const group of fetch) {
      const picture = await instance.profilePicture(group.id);

      const result: any = {
        id: group.id,
        subject: group.subject,
        subjectOwner: group.subjectOwner,
        subjectTime: group.subjectTime,
        pictureUrl: picture?.profilePictureUrl,
        size: group.participants.length,
        creation: group.creation,
        owner: group.owner,
        desc: group.desc,
        descId: group.descId,
        restrict: group.restrict,
        announce: group.announce,
        isCommunity: group.isCommunity,
        isCommunityAnnounce: group.isCommunityAnnounce,
        linkedParent: group.linkedParent,
      };

      if (getParticipants.getParticipants == 'true') {
        result['participants'] = group.participants;
      }

      groups.push(result);
    }

    return groups;
  }

  public async inviteCode(instance: BaileysStartupService, id: GroupJid) {
    try {
      const code = await instance.client.groupInviteCode(id.groupJid);
      return { inviteUrl: `https://chat.whatsapp.com/${code}`, inviteCode: code };
    } catch (error) {
      throw new NotFoundException('No invite code', error.toString());
    }
  }

  public async inviteInfo(instance: BaileysStartupService, id: GroupInvite) {
    try {
      return await instance.client.groupGetInviteInfo(id.inviteCode);
    } catch {
      throw new NotFoundException('No invite info', id.inviteCode);
    }
  }

  public async sendInvite(instance: BaileysStartupService, id: GroupSendInvite) {
    try {
      const inviteCode = await this.inviteCode(instance, { groupJid: id.groupJid });

      const inviteUrl = inviteCode.inviteUrl;

      const numbers = id.numbers.map((number) => createJid(number));
      const description = id.description ?? '';

      const msg = `${description}\n\n${inviteUrl}`;

      const message = { conversation: msg };

      for (const number of numbers) {
        await instance.textMessage({ number, text: msg }); // Delegate back to facade
      }

      return { send: true, inviteUrl };
    } catch {
      throw new NotFoundException('No send invite');
    }
  }

  public async acceptInviteCode(instance: BaileysStartupService, id: AcceptGroupInvite) {
    try {
      const groupJid = await instance.client.groupAcceptInvite(id.inviteCode);
      return { accepted: true, groupJid: groupJid };
    } catch (error) {
      throw new NotFoundException('Accept invite error', error.toString());
    }
  }

  public async revokeInviteCode(instance: BaileysStartupService, id: GroupJid) {
    try {
      const inviteCode = await instance.client.groupRevokeInvite(id.groupJid);
      return { revoked: true, inviteCode };
    } catch (error) {
      throw new NotFoundException('Revoke error', error.toString());
    }
  }

  public async findParticipants(instance: BaileysStartupService, id: GroupJid) {
    try {
      const participants = (await instance.client.groupMetadata(id.groupJid)).participants;
      const contacts = await this.prismaRepository.contact.findMany({
        where: { instanceId: instance.instanceId, remoteJid: { in: participants.map((p) => p.id) } },
      });
      const parsedParticipants = participants.map((participant) => {
        const contact = contacts.find((c) => c.remoteJid === participant.id);
        return {
          ...participant,
          name: (participant as any).name ?? contact?.pushName,
          imgUrl: (participant as any).imgUrl ?? contact?.profilePicUrl,
        };
      });

      const usersContacts = parsedParticipants.filter((c) => c.id.includes('@s.whatsapp'));
      if (usersContacts) {
        await saveOnWhatsappCache(usersContacts.map((c) => ({ remoteJid: c.id })));
      }

      return parsedParticipants;
    } catch (error) {
      throw new NotFoundException('Error fetching participants', error.toString());
    }
  }

  public async updateGParticipant(instance: BaileysStartupService, update: GroupUpdateParticipantDto) {
    try {
      const participants = update.participants.map((p) => createJid(p));
      const updateParticipant = await instance.client.groupParticipantsUpdate(
        update.groupJid,
        participants,
        update.action,
      );
      return { updateParticipant: updateParticipant };
    } catch (error) {
      throw new BadRequestException('Error updating participant', error.toString());
    }
  }

  public async updateGSetting(instance: BaileysStartupService, update: GroupUpdateSettingDto) {
    try {
      const updateSetting = await instance.client.groupSettingUpdate(update.groupJid, update.action);
      return { updateSetting: updateSetting };
    } catch (error) {
      throw new BadRequestException('Error updating setting', error.toString());
    }
  }

  public async toggleEphemeral(instance: BaileysStartupService, update: GroupToggleEphemeralDto) {
    try {
      await instance.client.groupToggleEphemeral(update.groupJid, update.expiration);
      return { success: true };
    } catch (error) {
      throw new BadRequestException('Error updating setting', error.toString());
    }
  }

  public async leaveGroup(instance: BaileysStartupService, id: GroupJid) {
    try {
      await instance.client.groupLeave(id.groupJid);
      return { groupJid: id.groupJid, leave: true };
    } catch (error) {
      throw new BadRequestException('Unable to leave the group', error.toString());
    }
  }
}
