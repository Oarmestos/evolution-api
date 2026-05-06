import { NumberBusiness } from '@api/dto/chat.dto';
import {
  Options,
  SendAudioDto,
  SendButtonsDto,
  SendContactDto,
  SendListDto,
  SendLocationDto,
  SendMediaDto,
  SendReactionDto,
  SendTemplateDto,
  SendTextDto,
} from '@api/dto/sendMessage.dto';
import { ProviderFiles } from '@api/provider/sessions';
import { PrismaRepository } from '@api/repository/repository.service';
import { CacheService } from '@api/services/cache.service';
import { ChannelStartupService } from '@api/services/channel.service';
import { Events, wa } from '@api/types/wa.types';
import { ConfigService, Database } from '@config/env.config';
import { BadRequestException, InternalServerErrorException } from '@exceptions';
import { createJid } from '@utils/createJid';
import EventEmitter2 from 'eventemitter2';

// Import sub-services
import { MetaConnectionService } from './services/whatsapp.meta.connection.service';
import { MetaMediaService } from './services/whatsapp.meta.media.service';
import { MetaMessageService } from './services/whatsapp.meta.message.service';
import { MetaProfileService } from './services/whatsapp.meta.profile.service';
import { MetaWebhookService } from './services/whatsapp.meta.webhook.service';

export class BusinessStartupService extends ChannelStartupService {
  private readonly connectionService: MetaConnectionService;
  private readonly profileService: MetaProfileService;
  private readonly mediaService: MetaMediaService;
  private readonly webhookService: MetaWebhookService;
  private readonly messageService: MetaMessageService;

  constructor(
    public readonly configService: ConfigService,
    public readonly eventEmitter: EventEmitter2,
    public readonly prismaRepository: PrismaRepository,
    public readonly cache: CacheService,
    public readonly chatwootCache: CacheService,
    public readonly baileysCache: CacheService,
    private readonly providerFiles: ProviderFiles,
  ) {
    super(configService, eventEmitter, prismaRepository, chatwootCache);

    // Initialize services
    this.connectionService = new MetaConnectionService(this.instance);
    this.profileService = new MetaProfileService(this.instance, this.configService);
    this.mediaService = new MetaMediaService(this.instance, this.configService);
    this.webhookService = new MetaWebhookService(
      this.instance,
      this.configService,
      this.prismaRepository,
      this.chatwootService,
      this.openaiService,
      this.mediaService,
      this.localSettings,
      this.localChatwoot,
      this.localWebhook,
      this.sendDataWebhook.bind(this),
    );
    this.messageService = new MetaMessageService(
      this.instance,
      this.configService,
      this.prismaRepository,
      this.chatwootService,
      this.mediaService,
      this.localChatwoot,
      this.sendDataWebhook.bind(this),
    );
  }

  // Delegate Connection properties and methods
  public get stateConnection() {
    return this.connectionService.stateConnection;
  }
  public set stateConnection(val) {
    this.connectionService.stateConnection = val;
  }
  public get phoneNumber() {
    return this.connectionService.phoneNumber;
  }
  public set phoneNumber(val) {
    this.connectionService.phoneNumber = val;
  }
  public get mobile() {
    return this.connectionService.mobile;
  }
  public set mobile(val) {
    this.connectionService.mobile = val;
  }

  public get connectionStatus() {
    return this.connectionService.connectionStatus;
  }
  public async closeClient() {
    return this.connectionService.closeClient();
  }
  public get qrCode() {
    return this.connectionService.qrCode;
  }
  public async logoutInstance() {
    return this.connectionService.logoutInstance();
  }

  // Delegate Profile methods
  public async profilePicture(number: string) {
    return this.profileService.profilePicture(number);
  }
  public async getProfileName() {
    return this.profileService.getProfileName();
  }
  public async profilePictureUrl() {
    return this.profileService.profilePictureUrl();
  }
  public async getProfileStatus() {
    return this.profileService.getProfileStatus();
  }
  public async setWhatsappBusinessProfile(data: NumberBusiness) {
    return this.profileService.setWhatsappBusinessProfile(data);
  }

  // Delegate Webhook / Handler methods
  public async connectToWhatsapp(data?: any) {
    if (!data) return;
    const content = data.entry[0].changes[0].value;
    try {
      this.loadChatwoot();
      await this.webhookService.eventHandler(content);
      this.phoneNumber = createJid(content.messages ? content.messages[0].from : content.statuses[0]?.recipient_id);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.toString());
    }
  }

  // Delegate Messaging methods
  public async textMessage(data: SendTextDto, isIntegration = false) {
    return this.messageService.textMessage(data, isIntegration);
  }
  public async mediaMessage(data: SendMediaDto, file?: any, isIntegration = false) {
    return this.messageService.mediaMessage(data, file, isIntegration);
  }
  public async audioWhatsapp(data: SendAudioDto, file?: any, isIntegration = false) {
    return this.messageService.audioWhatsapp(data, file, isIntegration);
  }
  public async buttonMessage(data: SendButtonsDto) {
    return this.messageService.buttonMessage(data);
  }
  public async locationMessage(data: SendLocationDto) {
    return this.messageService.locationMessage(data);
  }
  public async listMessage(data: SendListDto) {
    return this.messageService.listMessage(data);
  }
  public async templateMessage(data: SendTemplateDto, isIntegration = false) {
    return this.messageService.templateMessage(data, isIntegration);
  }
  public async contactMessage(data: SendContactDto) {
    return this.messageService.contactMessage(data);
  }
  public async reactionMessage(data: SendReactionDto) {
    return this.messageService.reactionMessage(data);
  }

  // Delegate Media methods
  public async getBase64FromMediaMessage(data: any) {
    return this.mediaService.getBase64FromMediaMessage(data);
  }

  // Not Available Methods
  public async deleteMessage() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async mediaSticker() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async pollMessage() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async statusMessage() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async reloadConnection() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async whatsappNumber() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async markMessageAsRead() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async archiveChat() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async markChatUnread() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async fetchProfile() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async offerCall() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async sendPresence() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async setPresence() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async fetchPrivacySettings() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updatePrivacySettings() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async fetchBusinessProfile() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updateProfileName() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updateProfileStatus() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updateProfilePicture() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async removeProfilePicture() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async blockUser() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updateMessage() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async createGroup() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updateGroupPicture() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updateGroupSubject() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updateGroupDescription() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async findGroup() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async fetchAllGroups() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async inviteCode() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async inviteInfo() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async sendInvite() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async acceptInviteCode() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async revokeInviteCode() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async findParticipants() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updateGParticipant() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async updateGSetting() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async toggleEphemeral() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async leaveGroup() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async fetchLabels() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async handleLabel() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async receiveMobileCode() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
  public async fakeCall() {
    throw new BadRequestException('Method not available on WhatsApp Business API');
  }
}
