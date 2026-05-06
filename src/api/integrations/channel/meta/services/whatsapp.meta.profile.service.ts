import { NumberBusiness } from '@api/dto/chat.dto';
import { wa } from '@api/types/wa.types';
import { ConfigService, WaBusiness } from '@config/env.config';
import { createJid } from '@utils/createJid';
import axios from 'axios';

export class MetaProfileService {
  constructor(
    private readonly instance: wa.Instance,
    private readonly configService: ConfigService,
  ) {}

  private get token() {
    return this.instance.token;
  }

  private get number() {
    return this.instance.number;
  }

  private async post(message: any, params: string) {
    try {
      let urlServer = this.configService.get<WaBusiness>('WA_BUSINESS').URL;
      const version = this.configService.get<WaBusiness>('WA_BUSINESS').VERSION;
      urlServer = `${urlServer}/${version}/${this.number}/${params}`;
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
      const result = await axios.post(urlServer, message, { headers });
      return result.data;
    } catch (e) {
      return e.response?.data?.error;
    }
  }

  public async profilePicture(number: string) {
    const jid = createJid(number);
    return {
      wuid: jid,
      profilePictureUrl: null,
    };
  }

  public async getProfileName() {
    return null;
  }

  public async profilePictureUrl() {
    return null;
  }

  public async getProfileStatus() {
    return null;
  }

  public async setWhatsappBusinessProfile(data: NumberBusiness): Promise<any> {
    const content = {
      messaging_product: 'whatsapp',
      about: data.about,
      address: data.address,
      description: data.description,
      vertical: data.vertical,
      email: data.email,
      websites: data.websites,
      profile_picture_handle: data.profilehandle,
    };
    return await this.post(content, 'whatsapp_business_profile');
  }
}
