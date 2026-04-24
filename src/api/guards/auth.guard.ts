import { InstanceDto } from '@api/dto/instance.dto';
import { prismaRepository } from '@api/server.module';
import { Auth, configService, Database } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

const logger = new Logger('GUARD');

async function apikey(req: Request, _: Response, next: NextFunction) {
  const env = configService.get<Auth>('AUTHENTICATION').API_KEY;
  const key = req.get('apikey') || req.headers.authorization?.replace('Bearer ', '') || req.cookies?.avri_token;
  const db = configService.get<Database>('DATABASE');

  if (!key) {
    throw new UnauthorizedException();
  }

  // 1. Validar Clave Global (Admin)
  if (env.KEY === key) {
    return next();
  }

  // 2. Validar JWT (SaaS Users)
  try {
    const payload = verify(key, env.KEY || 'avri_secret_key') as any;
    if (payload) {
      req['user'] = payload; // Adjuntamos el usuario a la petición
      return next();
    }
  } catch {
    // Si falla JWT, intentamos validar por token de instancia (Legacy/Compatibility)
  }

  if ((req.originalUrl.includes('/instance/create') || req.originalUrl.includes('/instance/fetchInstances')) && !key) {
    throw new ForbiddenException('Missing global api key', 'The global api key must be set');
  }
  const param = req.params as unknown as InstanceDto;

  try {
    if (param?.instanceName) {
      const instance = await prismaRepository.instance.findUnique({
        where: { name: param.instanceName },
      });
      if (instance && instance.token === key) {
        return next();
      }
    } else {
      if (req.originalUrl.includes('/instance/fetchInstances') && db.SAVE_DATA.INSTANCE) {
        const instanceByKey = await prismaRepository.instance.findFirst({
          where: { token: key },
        });
        if (instanceByKey) {
          return next();
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }

  throw new UnauthorizedException();
}

export const authGuard = { apikey };
