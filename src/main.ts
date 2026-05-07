// Import this first from sentry instrument!
import '@utils/instrumentSentry';

// Now import other modules
import { ProviderFiles } from '@api/provider/sessions';
import { PrismaRepository } from '@api/repository/repository.service';
import { HttpStatus, router } from '@api/routes/index.router';
import { eventManager, waMonitor } from '@api/server.module';
import { configService, Cors, HttpServer, ProviderSession, Sentry as SentryConfig, Webhook } from '@config/env.config';
import { onUnexpectedError } from '@config/error.config';
import { Logger } from '@config/logger.config';
import { ROOT_DIR } from '@config/path.config';
import { getSwaggerOptions } from '@config/swagger.config';
import * as Sentry from '@sentry/node';
import { getBodyLimits, isCorsOriginAllowed } from '@utils/http-hardening';
import { ServerUP } from '@utils/server-up';
import axios from 'axios';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { json, NextFunction, Request, Response, urlencoded } from 'express';
import { join } from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { BaseException } from './exceptions/base.exception';

async function initWA() {
  await waMonitor.loadInstance();
}

async function bootstrap() {
  const logger = new Logger('SERVER');
  const app = express();

  let providerFiles: ProviderFiles = null;
  if (configService.get<ProviderSession>('PROVIDER').ENABLED) {
    providerFiles = new ProviderFiles(configService);
    await providerFiles.onModuleInit();
    logger.info('Provider:Files - ON');
  }

  const prismaRepository = new PrismaRepository(configService);
  await prismaRepository.onModuleInit();
  const bodyLimits = getBodyLimits();

  app.use(
    cors({
      origin(requestOrigin, callback) {
        const { ORIGIN } = configService.get<Cors>('CORS');

        if (isCorsOriginAllowed(requestOrigin, ORIGIN)) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      },
      methods: [...configService.get<Cors>('CORS').METHODS],
      credentials: configService.get<Cors>('CORS').CREDENTIALS,
    }),
    urlencoded({ extended: true, limit: bodyLimits.urlencoded }),
    json({ limit: bodyLimits.json }),
    cookieParser(),
    compression(),
  );

  app.set('view engine', 'hbs');
  app.set('views', join(ROOT_DIR, 'views'));

  // app.use(express.static(join(ROOT_DIR, 'public')));
  // app.use(express.static(join(ROOT_DIR, 'public')));
  app.use(express.static(join(ROOT_DIR, 'frontend', 'dist')));

  // SPA fallback for React Router
  app.use('/', router);

  app.get('*', (req, res, next) => {
    // Skip API requests and static assets
    const apiPrefixes = ['/api', '/instance', '/product', '/order', '/webhook', '/chatwoot', '/assets'];
    const isApiRoute = apiPrefixes.some(prefix => req.url === prefix || req.url.startsWith(prefix + '/'));

    if (isApiRoute || req.url.includes('.')) {
      return next();
    }

    res.sendFile(join(ROOT_DIR, 'frontend', 'dist', 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  });

  app.use(
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err) {
        const webhook = configService.get<Webhook>('WEBHOOK');

        const isBaseException = err instanceof BaseException;
        const status = isBaseException ? (err as BaseException).status : err['status'] || 500;
        const error = isBaseException ? (err as BaseException).error : err['error'] || 'Internal Server Error';
        const message = isBaseException ? err.message : err['message'] || 'Internal Server Error';

        if (webhook.EVENTS.ERRORS_WEBHOOK && webhook.EVENTS.ERRORS_WEBHOOK != '' && webhook.EVENTS.ERRORS) {
          const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
          const localISOTime = new Date(Date.now() - tzoffset).toISOString();
          const now = localISOTime;
          const serverUrl = configService.get<HttpServer>('SERVER').URL;

          const errorData = {
            event: 'error',
            data: {
              error,
              message,
              status,
              response: {
                message,
              },
            },
            date_time: now,
            server_url: serverUrl,
          };

          logger.error(errorData);

          const baseURL = webhook.EVENTS.ERRORS_WEBHOOK;
          const httpService = axios.create({ baseURL });

          httpService.post('', errorData);
        }

        return res.status(status).json({
          status,
          error,
          response: {
            message,
          },
        });
      }

      next();
    },
    (req: Request, res: Response, next: NextFunction) => {
      const { method, url } = req;

      res.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        response: {
          message: [`Cannot ${method.toUpperCase()} ${url}`],
        },
      });

      next();
    },
  );

  const httpServer = configService.get<HttpServer>('SERVER');

  ServerUP.app = app;
  let server = ServerUP[httpServer.TYPE];

  if (server === null) {
    logger.warn('SSL cert load failed — falling back to HTTP.');
    logger.info("Ensure 'SSL_CONF_PRIVKEY' and 'SSL_CONF_FULLCHAIN' env vars point to valid certificate files.");

    httpServer.TYPE = 'http';
    server = ServerUP[httpServer.TYPE];
  }

  eventManager.init(server);

  // Swagger documentation
  const swaggerOptions = getSwaggerOptions(configService);
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger - ON: /docs');

  const sentryConfig = configService.get<SentryConfig>('SENTRY');
  if (sentryConfig.DSN) {
    logger.info('Sentry - ON');

    // Add this after all routes,
    // but before any and other error-handling middlewares are defined
    Sentry.setupExpressErrorHandler(app);
  }

  server.listen(httpServer.PORT, () => logger.log(httpServer.TYPE.toUpperCase() + ' - ON: ' + httpServer.PORT));

  initWA().catch((error) => {
    logger.error('Error loading instances: ' + error);
  });

  onUnexpectedError();
}

bootstrap();
