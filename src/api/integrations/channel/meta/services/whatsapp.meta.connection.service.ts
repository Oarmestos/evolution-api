import { wa } from '@api/types/wa.types';
import { Logger } from '@config/logger.config';

export class MetaConnectionService {
  private readonly logger = new Logger('MetaConnectionService');

  constructor(private readonly instance: wa.Instance) {}

  public stateConnection: wa.StateConnection = { state: 'open' };
  public phoneNumber: string;
  public mobile: boolean;

  public get connectionStatus() {
    return this.stateConnection;
  }

  public async closeClient() {
    this.stateConnection = { state: 'close' };
  }

  public get qrCode(): wa.QrCode {
    return {
      pairingCode: this.instance.qrcode?.pairingCode,
      code: this.instance.qrcode?.code,
      base64: this.instance.qrcode?.base64,
      count: this.instance.qrcode?.count,
    };
  }

  public async logoutInstance() {
    await this.closeClient();
  }
}
