import { CacheEngine } from '@cache/cacheengine';
import { Chatwoot, configService, ProviderSession } from '@config/env.config';
import { eventEmitter } from '@config/event.config';
import { Logger } from '@config/logger.config';

import { BusinessController } from './controllers/business.controller';
import { CallController } from './controllers/call.controller';
import { ChatController } from './controllers/chat.controller';
import { GroupController } from './controllers/group.controller';
import { InstanceController } from './controllers/instance.controller';
import { LabelController } from './controllers/label.controller';
import { LeadController } from './controllers/lead.controller';
import { OrderController } from './controllers/order.controller';
import { ProductController } from './controllers/product.controller';
import { ProxyController } from './controllers/proxy.controller';
import { SendMessageController } from './controllers/sendMessage.controller';
import { SettingsController } from './controllers/settings.controller';
import { TemplateController } from './controllers/template.controller';
import { ThemeController } from './controllers/theme.controller';
import { UserController } from './controllers/user.controller';
import { ChannelController } from './integrations/channel/channel.controller';
import { EvolutionController } from './integrations/channel/evolution/evolution.controller';
import { MetaController } from './integrations/channel/meta/meta.controller';
import { BaileysController } from './integrations/channel/whatsapp/baileys.controller';
import { ChatbotController } from './integrations/chatbot/chatbot.controller';
import { ChatwootController } from './integrations/chatbot/chatwoot/controllers/chatwoot.controller';
import { ChatwootService } from './integrations/chatbot/chatwoot/services/chatwoot.service';
import { DifyController } from './integrations/chatbot/dify/controllers/dify.controller';
import { DifyService } from './integrations/chatbot/dify/services/dify.service';
import { EvoaiController } from './integrations/chatbot/evoai/controllers/evoai.controller';
import { EvoaiService } from './integrations/chatbot/evoai/services/evoai.service';
import { EvolutionBotController } from './integrations/chatbot/evolutionBot/controllers/evolutionBot.controller';
import { EvolutionBotService } from './integrations/chatbot/evolutionBot/services/evolutionBot.service';
import { FlowiseController } from './integrations/chatbot/flowise/controllers/flowise.controller';
import { FlowiseService } from './integrations/chatbot/flowise/services/flowise.service';
import { N8nController } from './integrations/chatbot/n8n/controllers/n8n.controller';
import { N8nService } from './integrations/chatbot/n8n/services/n8n.service';
import { OpenaiController } from './integrations/chatbot/openai/controllers/openai.controller';
import { OpenaiService } from './integrations/chatbot/openai/services/openai.service';
import { TypebotController } from './integrations/chatbot/typebot/controllers/typebot.controller';
import { TypebotService } from './integrations/chatbot/typebot/services/typebot.service';
import { EventManager } from './integrations/event/event.manager';
import { S3Controller } from './integrations/storage/s3/controllers/s3.controller';
import { S3Service } from './integrations/storage/s3/services/s3.service';
import { AppRegistry } from './module.registry';
import { ProviderFiles } from './provider/sessions';
import { PrismaRepository } from './repository/repository.service';
import { CacheService } from './services/cache.service';
import { LeadService } from './services/lead.service';
import { WAMonitoringService } from './services/monitor.service';
import { OrderService } from './services/order.service';
import { ProductService } from './services/product.service';
import { ProxyService } from './services/proxy.service';
import { SettingsService } from './services/settings.service';
import { TemplateService } from './services/template.service';
import { ThemeService } from './services/theme.service';
import { UserService } from './services/user.service';

const logger = new Logger('WA MODULE');

let chatwootCache: CacheService = null;
if (configService.get<Chatwoot>('CHATWOOT').ENABLED) {
  chatwootCache = new CacheService(new CacheEngine(configService, ChatwootService.name).getEngine());
}

const cache = new CacheService(new CacheEngine(configService, 'instance').getEngine());
const baileysCache = new CacheService(new CacheEngine(configService, 'baileys').getEngine());

let providerFiles: ProviderFiles = null;
if (configService.get<ProviderSession>('PROVIDER').ENABLED) {
  providerFiles = new ProviderFiles(configService);
}

const prismaRepository = new PrismaRepository(configService);

const waMonitor = new WAMonitoringService(
  eventEmitter,
  configService,
  prismaRepository,
  providerFiles,
  cache,
  chatwootCache,
  baileysCache,
);

// Registrar servicios principales en el registro
AppRegistry.register('prismaRepository', () => prismaRepository);
AppRegistry.register('cache', () => cache);
AppRegistry.register('baileysCache', () => baileysCache);
AppRegistry.register('chatwootCache', () => chatwootCache);
AppRegistry.register('providerFiles', () => providerFiles);
AppRegistry.register('waMonitor', () => waMonitor);

// Servicios
const s3Service = new S3Service(prismaRepository);
AppRegistry.register(S3Service, () => s3Service);

const templateService = new TemplateService(waMonitor, prismaRepository, configService);
AppRegistry.register(TemplateService, () => templateService);

const proxyService = new ProxyService(waMonitor);
AppRegistry.register(ProxyService, () => proxyService);

const chatwootService = new ChatwootService(waMonitor, configService, prismaRepository, chatwootCache);
AppRegistry.register(ChatwootService, () => chatwootService);

const settingsService = new SettingsService(waMonitor);
AppRegistry.register(SettingsService, () => settingsService);

const leadService = new LeadService(prismaRepository, waMonitor);
AppRegistry.register(LeadService, () => leadService);

const openaiService = new OpenaiService(waMonitor, prismaRepository, configService);
AppRegistry.register(OpenaiService, () => openaiService);

const typebotService = new TypebotService(waMonitor, configService, prismaRepository, openaiService);
AppRegistry.register(TypebotService, () => typebotService);

const difyService = new DifyService(waMonitor, prismaRepository, configService, openaiService);
AppRegistry.register(DifyService, () => difyService);

const evolutionBotService = new EvolutionBotService(waMonitor, prismaRepository, configService, openaiService);
AppRegistry.register(EvolutionBotService, () => evolutionBotService);

const flowiseService = new FlowiseService(waMonitor, prismaRepository, configService, openaiService);
AppRegistry.register(FlowiseService, () => flowiseService);

const n8nService = new N8nService(waMonitor, prismaRepository, configService, openaiService);
AppRegistry.register(N8nService, () => n8nService);

const evoaiService = new EvoaiService(waMonitor, prismaRepository, configService, openaiService);
AppRegistry.register(EvoaiService, () => evoaiService);

const userService = new UserService(prismaRepository);
AppRegistry.register(UserService, () => userService);

const themeService = new ThemeService(prismaRepository);
AppRegistry.register(ThemeService, () => themeService);

const productService = new ProductService(prismaRepository);
AppRegistry.register(ProductService, () => productService);

const orderService = new OrderService(prismaRepository);
AppRegistry.register(OrderService, () => orderService);

// Controladores
AppRegistry.register(S3Controller, () => new S3Controller(s3Service));
AppRegistry.register(TemplateController, () => new TemplateController(templateService));
AppRegistry.register(ProxyController, () => new ProxyController(proxyService, waMonitor));
AppRegistry.register(ChatwootController, () => new ChatwootController(chatwootService, configService));
AppRegistry.register(SettingsController, () => new SettingsController(settingsService));
AppRegistry.register(LeadController, () => new LeadController(leadService));
AppRegistry.register(
  InstanceController,
  () =>
    new InstanceController(
      waMonitor,
      configService,
      prismaRepository,
      eventEmitter,
      chatwootService,
      settingsService,
      AppRegistry.resolve(ProxyController),
      cache,
      chatwootCache,
      baileysCache,
      providerFiles,
    ),
);
AppRegistry.register(SendMessageController, () => new SendMessageController(waMonitor));
AppRegistry.register(CallController, () => new CallController(waMonitor));
AppRegistry.register(ChatController, () => new ChatController(waMonitor));
AppRegistry.register(BusinessController, () => new BusinessController(waMonitor));
AppRegistry.register(GroupController, () => new GroupController(waMonitor));
AppRegistry.register(LabelController, () => new LabelController(waMonitor));

AppRegistry.register(EventManager, () => new EventManager(prismaRepository, waMonitor));
AppRegistry.register(ChatbotController, () => new ChatbotController(prismaRepository, waMonitor));
AppRegistry.register(ChannelController, () => new ChannelController(prismaRepository, waMonitor));

AppRegistry.register(EvolutionController, () => new EvolutionController(prismaRepository, waMonitor));
AppRegistry.register(MetaController, () => new MetaController(prismaRepository, waMonitor));
AppRegistry.register(BaileysController, () => new BaileysController(waMonitor));

AppRegistry.register(OpenaiController, () => new OpenaiController(openaiService, prismaRepository, waMonitor));
AppRegistry.register(TypebotController, () => new TypebotController(typebotService, prismaRepository, waMonitor));
AppRegistry.register(DifyController, () => new DifyController(difyService, prismaRepository, waMonitor));
AppRegistry.register(
  EvolutionBotController,
  () => new EvolutionBotController(evolutionBotService, prismaRepository, waMonitor),
);
AppRegistry.register(FlowiseController, () => new FlowiseController(flowiseService, prismaRepository, waMonitor));
AppRegistry.register(N8nController, () => new N8nController(n8nService, prismaRepository, waMonitor));
AppRegistry.register(EvoaiController, () => new EvoaiController(evoaiService, prismaRepository, waMonitor));

AppRegistry.register(UserController, () => new UserController(userService));
AppRegistry.register(ThemeController, () => new ThemeController(themeService));
AppRegistry.register(ProductController, () => new ProductController(productService));
AppRegistry.register(OrderController, () => new OrderController(orderService));

// Exportaciones para compatibilidad (mantener existentes)
export const eventManager = AppRegistry.resolve(EventManager);
export const channelController = AppRegistry.resolve(ChannelController);
export const chatbotController = AppRegistry.resolve(ChatbotController);
export const s3Controller = AppRegistry.resolve(S3Controller);
export const templateController = AppRegistry.resolve(TemplateController);
export const proxyController = AppRegistry.resolve(ProxyController);
export const chatwootController = AppRegistry.resolve(ChatwootController);
export const settingsController = AppRegistry.resolve(SettingsController);
export const leadController = AppRegistry.resolve(LeadController);
export const instanceController = AppRegistry.resolve(InstanceController);
export const sendMessageController = AppRegistry.resolve(SendMessageController);
export const callController = AppRegistry.resolve(CallController);
export const chatController = AppRegistry.resolve(ChatController);
export const businessController = AppRegistry.resolve(BusinessController);
export const groupController = AppRegistry.resolve(GroupController);
export const labelController = AppRegistry.resolve(LabelController);
export const evolutionController = AppRegistry.resolve(EvolutionController);
export const metaController = AppRegistry.resolve(MetaController);
export const baileysController = AppRegistry.resolve(BaileysController);
export const openaiController = AppRegistry.resolve(OpenaiController);
export const typebotController = AppRegistry.resolve(TypebotController);
export const difyController = AppRegistry.resolve(DifyController);
export const evolutionBotController = AppRegistry.resolve(EvolutionBotController);
export const flowiseController = AppRegistry.resolve(FlowiseController);
export const n8nController = AppRegistry.resolve(N8nController);
export const evoaiController = AppRegistry.resolve(EvoaiController);
export const userController = AppRegistry.resolve(UserController);
export const themeController = AppRegistry.resolve(ThemeController);
export const productController = AppRegistry.resolve(ProductController);
export const orderController = AppRegistry.resolve(OrderController);
export { cache, prismaRepository, waMonitor };

logger.info('Module - ON');
