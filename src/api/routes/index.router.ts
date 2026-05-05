import { authGuard } from '@api/guards/auth.guard';
import { instanceExistsGuard, instanceLoggedGuard } from '@api/guards/instance.guard';
import Telemetry from '@api/guards/telemetry.guard';
import { ChannelRouter } from '@api/integrations/channel/channel.router';
import { ChatbotRouter } from '@api/integrations/chatbot/chatbot.router';
import { EventRouter } from '@api/integrations/event/event.router';
import { StorageRouter } from '@api/integrations/storage/storage.router';
import { waMonitor } from '@api/server.module';
import { configService, Database, Facebook, getSecurityStatus } from '@config/env.config';
import { buildHealthStatus } from '@utils/http-hardening';
import { getClientIps, isMetricsIpAllowed, renderPrometheusMetrics, verifyMetricsBasicAuth } from '@utils/metrics';
import { NextFunction, Request, Response, Router } from 'express';
import fs from 'fs';

import { BusinessRouter } from './business.router';
import { CallRouter } from './call.router';
import { ChatRouter } from './chat.router';
import { GroupRouter } from './group.router';
import { HttpStatus } from './http-status.enum';
import { InstanceRouter } from './instance.router';
import { LabelRouter } from './label.router';
import { LeadRouter } from './lead.router';
import { OrderRouter } from './order.router';
import { ProductRouter } from './product.router';
import { ProxyRouter } from './proxy.router';
import { MessageRouter } from './sendMessage.router';
import { SettingsRouter } from './settings.router';
import { TemplateRouter } from './template.router';
import { ThemeRouter } from './theme.router';
import { UserRouter } from './user.router';

const router: Router = Router();
const serverConfig = configService.get('SERVER');
const databaseConfig = configService.get<Database>('DATABASE');
const guards = [instanceExistsGuard, instanceLoggedGuard, authGuard['apikey']];

const telemetry = new Telemetry();

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

function maskSecret(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.length <= 8 ? '********' : `${value.slice(0, 4)}...${value.slice(-4)}`;
}

// Middleware for metrics IP whitelist
const metricsIPWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const metricsConfig = configService.get('METRICS');
  const clientIps = getClientIps([
    req.ip,
    req.connection.remoteAddress,
    req.socket.remoteAddress,
    req.headers['x-forwarded-for'],
  ]);

  if (!isMetricsIpAllowed(metricsConfig.ALLOWED_IPS, clientIps)) {
    return res.status(403).send('Forbidden: IP not allowed');
  }

  next();
};

// Middleware for metrics Basic Authentication
const metricsBasicAuth = (req: Request, res: Response, next: NextFunction) => {
  const metricsConfig = configService.get('METRICS');
  const authResult = verifyMetricsBasicAuth(req.get('Authorization'), metricsConfig);

  if (!authResult.ok && authResult.status === 401) {
    res.set('WWW-Authenticate', 'Basic realm="Avri API Metrics"');
  }

  if (!authResult.ok) {
    return res.status(authResult.status).send(authResult.message);
  }

  next();
};

// Expose Prometheus metrics when enabled by env flag
const metricsConfig = configService.get('METRICS');
if (metricsConfig.ENABLED) {
  const metricsMiddleware = [];

  // Add IP whitelist if configured
  if (metricsConfig.ALLOWED_IPS) {
    metricsMiddleware.push(metricsIPWhitelist);
  }

  // Add Basic Auth if required
  if (metricsConfig.AUTH_REQUIRED) {
    metricsMiddleware.push(metricsBasicAuth);
  }

  router.get('/metrics', ...metricsMiddleware, async (req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    res.send(
      renderPrometheusMetrics({
        version: packageJson.version,
        clientName: databaseConfig.CONNECTION.CLIENT_NAME,
        serverUrl: serverConfig.URL,
        instances: (waMonitor && waMonitor.waInstances) || {},
      }),
    );
  });
}

/*
router.get('/assets/*', (req, res) => {
  const fileName = req.params[0];

  // Security: Reject paths containing traversal patterns
  if (!fileName || fileName.includes('..') || fileName.includes('\\') || path.isAbsolute(fileName)) {
    return res.status(403).send('Forbidden');
  }

  const basePath = path.join(process.cwd(), 'manager', 'dist');
  const assetsPath = path.join(basePath, 'assets');
  const filePath = path.join(assetsPath, fileName);

  // Security: Ensure the resolved path is within the assets directory
  const resolvedPath = path.resolve(filePath);
  const resolvedAssetsPath = path.resolve(assetsPath);

  if (!resolvedPath.startsWith(resolvedAssetsPath + path.sep) && resolvedPath !== resolvedAssetsPath) {
    return res.status(403).send('Forbidden');
  }

  if (fs.existsSync(resolvedPath)) {
    res.set('Content-Type', mimeTypes.lookup(resolvedPath) || 'text/css');
    res.send(fs.readFileSync(resolvedPath));
  } else {
    res.status(404).send('File not found');
  }
});
*/

router
  .use((req, res, next) => telemetry.collectTelemetry(req, res, next))
  .get('/health', async (req, res) => {
    const securityStatus = getSecurityStatus();

    return res.status(securityStatus.apiKeySecure ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(
      buildHealthStatus({
        version: packageJson.version,
        databaseProvider: databaseConfig.PROVIDER,
        apiKeySecure: securityStatus.apiKeySecure,
        securityIssueCount: securityStatus.issues.length,
      }),
    );
  })

  // Route disabled to allow serving index.html from public folder
  /*
  .get('/', async (req, res) => {
    res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Welcome to the Avri Platform, it is working!',
      version: packageJson.version,
      clientName: databaseConfig.CONNECTION.CLIENT_NAME,
      manager: !serverConfig.DISABLE_MANAGER ? `${req.protocol}://${req.get('host')}/manager` : undefined,
      documentation: `https://doc.avri.com`,
      whatsappWebVersion: (await fetchLatestWaWebVersion({})).version.join('.'),
    });
  })
  */
  .post('/verify-creds', authGuard['apikey'], async (req, res) => {
    const facebookConfig = configService.get<Facebook>('FACEBOOK');
    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Credentials are valid',
      facebookAppId: facebookConfig.APP_ID,
      facebookConfigId: facebookConfig.CONFIG_ID,
      facebookUserTokenConfigured: !!facebookConfig.USER_TOKEN,
      facebookUserTokenPreview: maskSecret(facebookConfig.USER_TOKEN),
    });
  })
  .use('/instance', new InstanceRouter(configService, ...guards).router)
  .use('/product', new ProductRouter(...guards).router)
  .use('/order', new OrderRouter(...guards).router)
  .use('/lead', new LeadRouter(...guards).router)
  .use('/message', new MessageRouter(...guards).router)
  .use('/call', new CallRouter(...guards).router)
  .use('/chat', new ChatRouter(...guards).router)
  .use('/business', new BusinessRouter(...guards).router)
  .use('/group', new GroupRouter(...guards).router)
  .use('/template', new TemplateRouter(configService, ...guards).router)
  .use('/settings', new SettingsRouter(...guards).router)
  .use('/proxy', new ProxyRouter(...guards).router)
  .use('/label', new LabelRouter(...guards).router)
  .use('', new ChannelRouter(configService, ...guards).router)
  .use('', new EventRouter(configService, ...guards).router)
  .use('', new ChatbotRouter(...guards).router)
  .use('', new StorageRouter(...guards).router)
  .use('/user', new UserRouter().router)
  .use('/theme', new ThemeRouter(authGuard['apikey']).router)
  .get('/store-api/:instanceName', async (req, res, next) => {
    try {
      const { themeController } = await import('@api/server.module');
      return themeController.getStoreByInstance(req, res);
    } catch (error) {
      next(error);
    }
  });

export { HttpStatus, router };
