import { PrismaRepository } from '@api/repository/repository.service';
import { Events } from '@api/types/wa.types';
import { Logger } from '@config/logger.config';
import { Instance as InstanceModel, IntegrationSession } from '@prisma/client';
import { sendTelemetry } from '@utils/sendTelemetry';

import { TypebotFormattingService } from './typebot.formatting.service';

export class TypebotMessageService {
  private readonly logger = new Logger('TypebotMessageService');

  constructor(
    private readonly prismaRepository: PrismaRepository,
    private readonly formattingService: TypebotFormattingService,
  ) {}

  /**
   * Send WhatsApp message with complex TypeBot formatting
   */
  public async sendWAMessage(
    instanceDb: InstanceModel,
    session: IntegrationSession,
    settings: any,
    remoteJid: string,
    messages: any,
    input: any,
    clientSideActions: any,
    waInstance: any,
    sendMessageWhatsApp: (
      instance: any,
      remoteJid: string,
      text: string,
      settings: any,
      typing: boolean,
    ) => Promise<void>,
  ) {
    await this.processMessages(
      waInstance,
      session,
      settings,
      messages,
      input,
      clientSideActions,
      sendMessageWhatsApp,
    ).catch((err) => {
      this.logger.error(`Error processing messages: ${err}`);
    });
  }

  /**
   * Process TypeBot messages with full feature support
   */
  private async processMessages(
    instance: any,
    session: IntegrationSession,
    settings: any,
    messages: any,
    input: any,
    clientSideActions: any,
    sendMessageWhatsApp: (
      instance: any,
      remoteJid: string,
      text: string,
      settings: any,
      typing: boolean,
    ) => Promise<void>,
  ) {
    const findItemAndGetSecondsToWait = (array: any[], targetId: string) => {
      if (!array) return null;
      for (const item of array) {
        if (item.lastBubbleBlockId === targetId) {
          return item.wait?.secondsToWaitFor;
        }
      }
      return null;
    };

    for (const message of messages) {
      if (message.type === 'text') {
        let formattedText = '';
        for (const richText of message.content.richText) {
          for (const element of richText.children) {
            formattedText += this.formattingService.applyFormatting(element);
          }
          formattedText += '\n';
        }

        formattedText = formattedText.replace(/\*\*/g, '').replace(/__/, '').replace(/~~/, '').replace(/\n$/, '');
        formattedText = formattedText.replace(/\n$/, '');

        if (formattedText.includes('[list]')) {
          await this.processListMessage(instance, formattedText, session.remoteJid);
        } else if (formattedText.includes('[buttons]')) {
          await this.processButtonMessage(instance, formattedText, session.remoteJid);
        } else {
          await sendMessageWhatsApp(instance, session.remoteJid, formattedText, settings, true);
        }
        sendTelemetry('/message/sendText');
      }

      if (message.type === 'image') {
        await instance.mediaMessage(
          {
            number: session.remoteJid,
            delay: settings?.delayMessage || 1000,
            mediatype: 'image',
            media: message.content.url,
          },
          null,
          false,
        );
        sendTelemetry('/message/sendMedia');
      }

      if (message.type === 'video') {
        await instance.mediaMessage(
          {
            number: session.remoteJid,
            delay: settings?.delayMessage || 1000,
            mediatype: 'video',
            media: message.content.url,
          },
          null,
          false,
        );
        sendTelemetry('/message/sendMedia');
      }

      if (message.type === 'audio') {
        await instance.audioWhatsapp(
          {
            number: session.remoteJid,
            delay: settings?.delayMessage || 1000,
            encoding: true,
            audio: message.content.url,
          },
          false,
        );
        sendTelemetry('/message/sendWhatsAppAudio');
      }

      const wait = findItemAndGetSecondsToWait(clientSideActions, message.id);
      if (wait) {
        await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      }
    }

    if (input) {
      if (input.type === 'choice input') {
        let formattedText = '';
        const items = input.items;
        for (const item of items) {
          formattedText += `▶️ ${item.content}\n`;
        }
        formattedText = formattedText.replace(/\n$/, '');

        if (formattedText.includes('[list]')) {
          await this.processListMessage(instance, formattedText, session.remoteJid);
        } else if (formattedText.includes('[buttons]')) {
          await this.processButtonMessage(instance, formattedText, session.remoteJid);
        } else {
          await sendMessageWhatsApp(instance, session.remoteJid, formattedText, settings, true);
        }
        sendTelemetry('/message/sendText');
      }

      await this.prismaRepository.integrationSession.update({
        where: { id: session.id },
        data: { awaitUser: true },
      });
    } else {
      let statusChange = 'closed';
      if (!settings?.keepOpen) {
        await this.prismaRepository.integrationSession.deleteMany({
          where: { id: session.id },
        });
        statusChange = 'delete';
      } else {
        await this.prismaRepository.integrationSession.update({
          where: { id: session.id },
          data: { status: 'closed' },
        });
      }

      const typebotData = {
        remoteJid: session.remoteJid,
        status: statusChange,
        session,
      };
      instance.sendDataWebhook(Events.TYPEBOT_CHANGE_STATUS, typebotData);
    }
  }

  /**
   * Process list messages for WhatsApp
   */
  private async processListMessage(instance: any, formattedText: string, remoteJid: string) {
    const listJson = { number: remoteJid, title: '', description: '', buttonText: '', footerText: '', sections: [] };

    const titleMatch = formattedText.match(/\[title\]([\s\S]*?)(?=\[description\])/);
    const descriptionMatch = formattedText.match(/\[description\]([\s\S]*?)(?=\[buttonText\])/);
    const buttonTextMatch = formattedText.match(/\[buttonText\]([\s\S]*?)(?=\[footerText\])/);
    const footerTextMatch = formattedText.match(/\[footerText\]([\s\S]*?)( menu\])/); // Fixed menu match

    if (titleMatch) listJson.title = titleMatch[1].trim();
    if (descriptionMatch) listJson.description = descriptionMatch[1].trim();
    if (buttonTextMatch) listJson.buttonText = buttonTextMatch[1].trim();
    if (footerTextMatch) listJson.footerText = footerTextMatch[1].trim();

    const menuContent = formattedText.match(/\[menu\]([\s\S]*?)\[\/menu\]/)?.[1];
    if (menuContent) {
      const sections = menuContent.match(/\[section\]([\s\S]*?)(?=\[section\]|\[\/section\]|\[\/menu\])/g);
      if (sections) {
        sections.forEach((section) => {
          const sectionTitle = section.match(/title: (.*?)(?:\n|$)/)?.[1]?.trim();
          const rows = section.match(/\[row\]([\s\S]*?)(?=\[row\]|\[\/row\]|\[\/section\]|\[\/menu\])/g);
          const sectionData = {
            title: sectionTitle,
            rows:
              rows?.map((row) => ({
                title: row.match(/title: (.*?)(?:\n|$)/)?.[1]?.trim(),
                description: row.match(/description: (.*?)(?:\n|$)/)?.[1]?.trim(),
                rowId: row.match(/rowId: (.*?)(?:\n|$)/)?.[1]?.trim(),
              })) || [],
          };
          listJson.sections.push(sectionData);
        });
      }
    }
    await instance.listMessage(listJson);
  }

  /**
   * Process button messages for WhatsApp
   */
  private async processButtonMessage(instance: any, formattedText: string, remoteJid: string) {
    const buttonJson = {
      number: remoteJid,
      thumbnailUrl: undefined,
      title: '',
      description: '',
      footer: '',
      buttons: [],
    };

    const thumbnailUrlMatch = formattedText.match(/\[thumbnailUrl\]([\s\S]*?)(?=\[title\])/);
    const titleMatch = formattedText.match(/\[title\]([\s\S]*?)(?=\[description\])/);
    const descriptionMatch = formattedText.match(/\[description\]([\s\S]*?)(?=\[footer\])/);
    const footerMatch = formattedText.match(/\[footer\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url))/);

    if (titleMatch) buttonJson.title = titleMatch[1].trim();
    if (thumbnailUrlMatch) buttonJson.thumbnailUrl = thumbnailUrlMatch[1].trim();
    if (descriptionMatch) buttonJson.description = descriptionMatch[1].trim();
    if (footerMatch) buttonJson.footer = footerMatch[1].trim();

    const buttonTypes = {
      reply: /\[reply\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
      pix: /\[pix\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
      copy: /\[copy\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
      call: /\[call\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
      url: /\[url\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
    };

    for (const [type, pattern] of Object.entries(buttonTypes)) {
      let match;
      while ((match = pattern.exec(formattedText)) !== null) {
        const content = match[1].trim();
        const button: any = { type };
        switch (type) {
          case 'pix':
            button.currency = content.match(/currency: (.*?)(?:\n|$)/)?.[1]?.trim();
            button.name = content.match(/name: (.*?)(?:\n|$)/)?.[1]?.trim();
            button.keyType = content.match(/keyType: (.*?)(?:\n|$)/)?.[1]?.trim();
            button.key = content.match(/key: (.*?)(?:\n|$)/)?.[1]?.trim();
            break;
          case 'reply':
            button.displayText = content.match(/displayText: (.*?)(?:\n|$)/)?.[1]?.trim();
            button.id = content.match(/id: (.*?)(?:\n|$)/)?.[1]?.trim();
            break;
          case 'copy':
            button.displayText = content.match(/displayText: (.*?)(?:\n|$)/)?.[1]?.trim();
            button.copyCode = content.match(/copyCode: (.*?)(?:\n|$)/)?.[1]?.trim();
            break;
          case 'call':
            button.displayText = content.match(/displayText: (.*?)(?:\n|$)/)?.[1]?.trim();
            button.phoneNumber = content.match(/phone: (.*?)(?:\n|$)/)?.[1]?.trim();
            break;
          case 'url':
            button.displayText = content.match(/displayText: (.*?)(?:\n|$)/)?.[1]?.trim();
            button.url = content.match(/url: (.*?)(?:\n|$)/)?.[1]?.trim();
            break;
        }
        if (Object.keys(button).length > 1) buttonJson.buttons.push(button);
      }
    }
    await instance.buttonMessage(buttonJson);
  }
}
