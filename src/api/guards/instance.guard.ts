import { InstanceDto } from '@api/dto/instance.dto';
import { cache, prismaRepository, waMonitor } from '@api/server.module';
import { CacheConf, configService } from '@config/env.config';
import { BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException } from '@exceptions';
import { NextFunction, Request, Response } from 'express';

async function getInstance(instanceName: string) {
  try {
    const cacheConf = configService.get<CacheConf>('CACHE');

    const exists = !!waMonitor.waInstances[instanceName];

    if (cacheConf.REDIS.ENABLED && cacheConf.REDIS.SAVE_INSTANCES) {
      const keyExists = await cache.has(instanceName);

      return exists || keyExists;
    }

    return (
      exists ||
      (
        await prismaRepository.instance.findMany({
          where: {
            OR: [{ name: instanceName }, { id: instanceName }],
          },
        })
      ).length > 0
    );
  } catch (error) {
    throw new InternalServerErrorException(error?.toString());
  }
}

export async function instanceExistsGuard(req: Request, _: Response, next: NextFunction) {
  if (req.originalUrl.includes('/instance/create') || req.originalUrl.includes('/instance/fetchInstances')) {
    return next();
  }

  const instanceName = req.params?.instanceName;
  if (!instanceName) {
    throw new BadRequestException('"instanceName" not provided.');
  }

  const instance = await prismaRepository.instance.findFirst({
    where: {
      OR: [{ name: instanceName }, { id: instanceName }],
    },
  });

  if (!instance) {
    throw new NotFoundException(`The "${instanceName}" instance does not exist`);
  }

  // Attach instance data to params so controllers can use instance.id
  Object.assign(req.params, instance);

  next();
}

export async function instanceLoggedGuard(req: Request, _: Response, next: NextFunction) {
  if (req.originalUrl.includes('/instance/create')) {
    const instance = req.body as InstanceDto;
    if (await getInstance(instance.instanceName)) {
      throw new ForbiddenException(`This name "${instance.instanceName}" is already in use.`);
    }

    if (waMonitor.waInstances[instance.instanceName]) {
      delete waMonitor.waInstances[instance.instanceName];
    }
  }

  next();
}
