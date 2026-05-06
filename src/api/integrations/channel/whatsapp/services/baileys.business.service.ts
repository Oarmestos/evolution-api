import { PrismaRepository } from '@api/repository/repository.service';
import { ConfigService } from '@config/env.config';
import { BadRequestException, InternalServerErrorException } from '@exceptions';
import { createJid } from '@utils/createJid';
import { proto } from 'baileys';

import { BaileysStartupService } from '../whatsapp.baileys.service';

export class BaileysBusinessService {
  constructor(
    private readonly prismaRepository: PrismaRepository,
    private readonly configService: ConfigService,
  ) {}

  public async fetchCatalog(instance: BaileysStartupService, data: any) {
    const jid = data.number ? createJid(data.number) : instance.client?.user?.id;
    const limit = data.limit || 10;
    const cursor = null;

    const onWhatsapp = (await instance.whatsappNumber({ numbers: [jid] }))?.shift();
    if (!onWhatsapp.exists) {
      throw new BadRequestException(onWhatsapp);
    }

    try {
      const info = (await instance.whatsappNumber({ numbers: [jid] }))?.shift();
      const business = await instance.fetchBusinessProfile(info?.jid);

      let catalog = await this.getCatalog(instance, { jid: info?.jid, limit, cursor });
      let nextPageCursor = catalog.nextPageCursor;
      let productsCatalog = catalog.products || [];
      let countLoops = 0;

      while (nextPageCursor && countLoops < 4) {
        catalog = await this.getCatalog(instance, { jid: info?.jid, limit, cursor: nextPageCursor });
        nextPageCursor = catalog.nextPageCursor;
        productsCatalog = [...productsCatalog, ...catalog.products];
        countLoops++;
      }

      return {
        wuid: info?.jid || jid,
        numberExists: info?.exists,
        isBusiness: business.isBusiness,
        catalogLength: productsCatalog.length,
        catalog: productsCatalog,
      };
    } catch (error) {
      console.error(error);
      return { wuid: jid, name: null, isBusiness: false };
    }
  }

  public async getCatalog(instance: BaileysStartupService, options: any) {
    try {
      const jid = options.jid ? createJid(options.jid) : instance.instance.wuid;
      const catalog = await instance.client.getCatalog({ jid, limit: options.limit, cursor: options.cursor });
      return catalog || { products: [], nextPageCursor: undefined };
    } catch (error) {
      throw new InternalServerErrorException('Error getCatalog', error.toString());
    }
  }

  public async fetchCollections(instance: BaileysStartupService, data: any) {
    const jid = data.number ? createJid(data.number) : instance.client?.user?.id;
    const limit = Math.min(data.limit || 20, 20);

    const onWhatsapp = (await instance.whatsappNumber({ numbers: [jid] }))?.shift();
    if (!onWhatsapp.exists) {
      throw new BadRequestException(onWhatsapp);
    }

    try {
      const info = (await instance.whatsappNumber({ numbers: [jid] }))?.shift();
      const business = await instance.fetchBusinessProfile(info?.jid);
      const collections = await this.getCollections(instance, info?.jid, limit);

      return {
        wuid: info?.jid || jid,
        name: info?.name,
        numberExists: info?.exists,
        isBusiness: business.isBusiness,
        collectionsLength: collections?.length,
        collections: collections,
      };
    } catch {
      return { wuid: jid, name: null, isBusiness: false };
    }
  }

  public async getCollections(instance: BaileysStartupService, jid: string, limit: number) {
    try {
      jid = jid ? createJid(jid) : instance.instance.wuid;
      const result = await instance.client.getCollections(jid, limit);
      return result?.collections || [];
    } catch (error) {
      throw new InternalServerErrorException('Error getCollections', error.toString());
    }
  }
}
