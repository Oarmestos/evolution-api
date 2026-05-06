import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Events } from '@api/types/wa.types';
import { ConfigService, Typebot } from '@config/env.config';
import { Instance, IntegrationSession, Message, Typebot as TypebotModel } from '@prisma/client';
import { getConversationMessage } from '@utils/getConversationMessage';
import axios from 'axios';

import { BaseChatbotService } from '../../base-chatbot.service';
import { OpenaiService } from '../../openai/services/openai.service';
import { TypebotFormattingService } from './typebot.formatting.service';
import { TypebotMessageService } from './typebot.message.service';
import { TypebotSessionService } from './typebot.session.service';

export class TypebotService extends BaseChatbotService<TypebotModel, any> {
  private openaiService: OpenaiService;
  private formattingService: TypebotFormattingService;
  private sessionService: TypebotSessionService;
  private messageService: TypebotMessageService;

  constructor(
    waMonitor: WAMonitoringService,
    configService: ConfigService,
    prismaRepository: PrismaRepository,
    openaiService: OpenaiService,
  ) {
    super(waMonitor, prismaRepository, 'TypebotService', configService);
    this.openaiService = openaiService;
    this.formattingService = new TypebotFormattingService();
    this.sessionService = new TypebotSessionService(prismaRepository, waMonitor, configService);
    this.messageService = new TypebotMessageService(prismaRepository, this.formattingService);
  }

  /**
   * Get the bot type identifier
   */
  protected getBotType(): string {
    return 'typebot';
  }

  /**
   * Base class wrapper - calls the original processTypebot method
   */
  protected async sendMessageToBot(
    instance: any,
    session: IntegrationSession,
    settings: any,
    bot: TypebotModel,
    remoteJid: string,
    pushName: string,
    content: string,
    msg?: any,
  ): Promise<void> {
    await this.processTypebot(
      instance,
      remoteJid,
      msg,
      session,
      bot,
      bot.url,
      settings.expire,
      bot.typebot,
      settings.keywordFinish,
      settings.delayMessage,
      settings.unknownMessage,
      settings.listeningFromMe,
      settings.stopBotFromMe,
      settings.keepOpen,
      content,
    );
  }

  /**
   * Simplified wrapper for controller compatibility
   */
  public async processTypebotSimple(
    instance: any,
    remoteJid: string,
    bot: TypebotModel,
    session: IntegrationSession,
    settings: any,
    content: string,
    pushName?: string,
    msg?: any,
  ): Promise<void> {
    return this.process(instance, remoteJid, bot, session, settings, content, pushName, msg);
  }

  /**
   * Create a new TypeBot session with prefilled variables
   */
  public async createNewSession(instance: Instance, data: any) {
    return this.sessionService.createNewSession(instance, data);
  }

  /**
   * Send WhatsApp message with complex TypeBot formatting
   */
  public async sendWAMessage(
    instanceDb: Instance,
    session: IntegrationSession,
    settings: any,
    remoteJid: string,
    messages: any,
    input: any,
    clientSideActions: any,
  ) {
    const waInstance = this.waMonitor.waInstances[instanceDb.name];
    await this.messageService.sendWAMessage(
      instanceDb,
      session,
      settings,
      remoteJid,
      messages,
      input,
      clientSideActions,
      waInstance,
      this.sendMessageWhatsApp.bind(this),
    );
  }

  /**
   * Original TypeBot processing method with full functionality
   */
  public async processTypebot(
    waInstance: any,
    remoteJid: string,
    msg: Message,
    session: IntegrationSession,
    findTypebot: TypebotModel,
    url: string,
    expire: number,
    typebot: string,
    keywordFinish: string,
    delayMessage: number,
    unknownMessage: string,
    listeningFromMe: boolean,
    stopBotFromMe: boolean,
    keepOpen: boolean,
    content: string,
    prefilledVariables?: any,
  ) {
    const instance = await this.prismaRepository.instance.findFirst({
      where: { name: waInstance.instanceName },
    });

    if (!instance) {
      this.logger.error('Instance not found in database');
      return;
    }

    // Handle session expiration
    const expired = await this.sessionService.handleSessionExpiration(
      instance,
      session,
      expire,
      keepOpen,
      findTypebot.id,
      remoteJid,
    );
    if (expired) {
      const data = await this.createNewSession(instance, {
        enabled: findTypebot?.enabled,
        url,
        typebot,
        expire,
        keywordFinish,
        delayMessage,
        unknownMessage,
        listeningFromMe,
        remoteJid,
        pushName: msg.pushName,
        botId: findTypebot.id,
        prefilledVariables,
      });

      if (data?.session) session = data.session;

      if (!data?.messages || data.messages.length === 0) {
        const contentMsg = getConversationMessage(msg.message);
        if (!contentMsg) {
          if (unknownMessage) {
            await this.sendMessageWhatsApp(
              waInstance,
              remoteJid,
              unknownMessage,
              { delayMessage, expire, keywordFinish, listeningFromMe, stopBotFromMe, keepOpen, unknownMessage },
              true,
            );
          }
          return;
        }

        if (keywordFinish && contentMsg.toLowerCase() === keywordFinish.toLowerCase()) {
          return this.finishSession(waInstance, session, findTypebot.id, remoteJid, keepOpen);
        }

        try {
          const request = await this.continueChat(url, data?.sessionId, contentMsg);
          await this.sendWAMessage(
            instance,
            session,
            { expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen },
            remoteJid,
            request?.data?.messages,
            request?.data?.input,
            request?.data?.clientSideActions,
          );
        } catch (error) {
          this.logger.error(error);
        }
        return;
      }

      if (data?.messages && data.messages.length > 0) {
        await this.sendWAMessage(
          instance,
          session,
          { expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen },
          remoteJid,
          data.messages,
          data.input,
          data.clientSideActions,
        );
      }
      return;
    }

    if (session && session.status !== 'opened') return;

    // Handle new sessions
    if (!session) {
      const data = await this.createNewSession(instance, {
        enabled: findTypebot?.enabled,
        url,
        typebot,
        expire,
        keywordFinish,
        delayMessage,
        unknownMessage,
        listeningFromMe,
        remoteJid,
        pushName: msg?.pushName,
        botId: findTypebot.id,
        prefilledVariables,
      });

      if (data?.session) session = data.session;
      if (data?.messages && data.messages.length > 0) {
        await this.sendWAMessage(
          instance,
          session,
          { expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen },
          remoteJid,
          data.messages,
          data.input,
          data.clientSideActions,
        );
      }

      if (!data?.messages || data.messages.length === 0) {
        if (!content) {
          if (unknownMessage) {
            await this.sendMessageWhatsApp(
              waInstance,
              remoteJid,
              unknownMessage,
              { delayMessage, expire, keywordFinish, listeningFromMe, stopBotFromMe, keepOpen, unknownMessage },
              true,
            );
          }
          return;
        }

        if (keywordFinish && content.toLowerCase() === keywordFinish.toLowerCase()) {
          return this.finishSession(waInstance, session, findTypebot.id, remoteJid, keepOpen);
        }

        try {
          const request = await this.continueChat(url, data?.sessionId, content);
          await this.sendWAMessage(
            instance,
            session,
            { expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen },
            remoteJid,
            request?.data?.messages,
            request?.data?.input,
            request?.data?.clientSideActions,
          );
        } catch (error) {
          this.logger.error(error);
        }
      }
      return;
    }

    // Update existing session
    await this.sessionService.updateSessionStatus(session.id, 'opened', false);

    if (!content) {
      if (unknownMessage) {
        await this.sendMessageWhatsApp(
          waInstance,
          remoteJid,
          unknownMessage,
          { delayMessage, expire, keywordFinish, listeningFromMe, stopBotFromMe, keepOpen, unknownMessage },
          true,
        );
      }
      return;
    }

    if (keywordFinish && content.toLowerCase() === keywordFinish.toLowerCase()) {
      return this.finishSession(waInstance, session, findTypebot.id, remoteJid, keepOpen);
    }

    // Continue existing chat
    try {
      const sessionId = session.sessionId.split('-')[1];
      let messageContent = content;

      if (this.isAudioMessage(content) && msg) {
        try {
          this.logger.debug(`[TypeBot] Downloading audio for Whisper transcription`);
          const transcription = await this.openaiService.speechToText(msg, instance);
          if (transcription) messageContent = `[audio] ${transcription}`;
        } catch (err) {
          this.logger.error(`[TypeBot] Failed to transcribe audio: ${err}`);
        }
      }

      const request = await this.continueChat(url, sessionId, messageContent);
      await this.sendWAMessage(
        instance,
        session,
        { expire, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen },
        remoteJid,
        request?.data?.messages,
        request?.data?.input,
        request?.data?.clientSideActions,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async finishSession(
    waInstance: any,
    session: IntegrationSession,
    botId: string,
    remoteJid: string,
    keepOpen: boolean,
  ) {
    let statusChange = 'closed';
    if (keepOpen) {
      await this.sessionService.updateSessionStatus(session.id, 'closed');
    } else {
      statusChange = 'delete';
      await this.sessionService.deleteSession(session.id);
    }

    const typebotData = { remoteJid, status: statusChange, session };
    waInstance.sendDataWebhook(Events.TYPEBOT_CHANGE_STATUS, typebotData);
  }

  private async continueChat(url: string, sessionId: string, message: string) {
    const version = this.configService.get<Typebot>('TYPEBOT').API_VERSION;
    let urlTypebot: string;
    let reqData: any;

    if (version === 'latest') {
      urlTypebot = `${url}/api/v1/sessions/${sessionId}/continueChat`;
      reqData = { message };
    } else {
      urlTypebot = `${url}/api/v1/sendMessage`;
      reqData = { message, sessionId };
    }

    return await axios.post(urlTypebot, reqData);
  }
}
