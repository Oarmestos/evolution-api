import { InstanceDto } from '@api/dto/instance.dto';
import { prismaRepository } from '@api/server.module';
import { Auth, configService, Database } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { ForbiddenException, TooManyRequestsException, UnauthorizedException } from '@exceptions';
import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

const logger = new Logger('AUTH_GUARD');

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_BLOCK = 30 * 60 * 1000;

const attempts = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function isTimingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  let attempt = attempts.get(clientIp);

  if (!attempt || now > (attempt.blockedUntil || 0)) {
    attempt = { count: 0, firstAttempt: now };
    attempts.set(clientIp, attempt);
  }

  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    return { allowed: false, remaining: 0, retryAfter: attempt.blockedUntil - now };
  }

  const windowElapsed = now - attempt.firstAttempt;
  if (windowElapsed > RATE_LIMIT_WINDOW) {
    attempt.count = 0;
    attempt.firstAttempt = now;
    attempt.blockedUntil = undefined;
  }

  const remaining = Math.max(0, RATE_LIMIT_MAX - attempt.count);

  if (remaining <= 0) {
    attempt.blockedUntil = now + RATE_LIMIT_BLOCK;
    logger.warn(`Rate limit exceeded for IP: ${clientIp}, blocked for ${RATE_LIMIT_BLOCK / 1000}s`);
    return { allowed: false, remaining: 0, retryAfter: RATE_LIMIT_BLOCK };
  }

  return { allowed: true, remaining, retryAfter: 0 };
}

function recordFailedAttempt(clientIp: string): void {
  const now = Date.now();
  let attempt = attempts.get(clientIp);

  if (!attempt) {
    attempt = { count: 0, firstAttempt: now };
    attempts.set(clientIp, attempt);
  }

  attempt.count++;
}

function logAuthAttempt(req: Request, success: boolean, method: string, details?: string): void {
  const clientIp = getClientIp(req);
  const timestamp = new Date().toISOString();

  if (success) {
    logger.info(`[${timestamp}] AUTH_SUCCESS | IP: ${clientIp} | Method: ${method} | URL: ${req.originalUrl}`);
  } else {
    logger.warn(
      `[${timestamp}] AUTH_FAILED | IP: ${clientIp} | Method: ${method} | URL: ${req.originalUrl} | ${details || 'Invalid credentials'}`,
    );
  }
}

async function apikey(req: Request, _: Response, next: NextFunction) {
  const clientIp = getClientIp(req);

  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    logAuthAttempt(req, false, 'RATE_LIMIT', `Blocked until ${rateLimit.retryAfter}ms`);
    throw new TooManyRequestsException(
      `Too many attempts. Try again in ${Math.ceil(rateLimit.retryAfter / 1000)} seconds`,
    );
  }

  const env = configService.get<Auth>('AUTHENTICATION').API_KEY;
  const key = req.get('apikey') || req.headers.authorization?.replace('Bearer ', '') || req.cookies?.avri_token;
  const db = configService.get<Database>('DATABASE');

  if (!key) {
    recordFailedAttempt(clientIp);
    logAuthAttempt(req, false, 'NO_KEY', 'Missing API key');
    throw new UnauthorizedException();
  }

  if (env.KEY && isTimingSafeCompare(env.KEY, key)) {
    logAuthAttempt(req, true, 'API_KEY_GLOBAL');
    return next();
  }

  try {
    const payload = verify(key, env.KEY || 'avri_secret_key') as any;
    if (payload) {
      req['user'] = payload;
      logAuthAttempt(req, true, 'JWT');
      return next();
    }
  } catch {
    // Continue to token validation
  }

  if ((req.originalUrl.includes('/instance/create') || req.originalUrl.includes('/instance/fetchInstances')) && !key) {
    recordFailedAttempt(clientIp);
    logAuthAttempt(req, false, 'MISSING_GLOBAL_KEY');
    throw new ForbiddenException('Missing global api key', 'The global api key must be set');
  }

  const param = req.params as unknown as InstanceDto;

  try {
    if (param?.instanceName) {
      const instance = await prismaRepository.instance.findUnique({
        where: { name: param.instanceName },
      });
      if (instance?.token && isTimingSafeCompare(instance.token, key)) {
        logAuthAttempt(req, true, 'INSTANCE_TOKEN', `Instance: ${param.instanceName}`);
        return next();
      }
    } else {
      if (req.originalUrl.includes('/instance/fetchInstances') && db.SAVE_DATA.INSTANCE) {
        const instanceByKey = await prismaRepository.instance.findFirst({
          where: { token: key },
        });
        if (instanceByKey) {
          logAuthAttempt(req, true, 'INSTANCE_TOKEN_LOOKUP');
          return next();
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }

  recordFailedAttempt(clientIp);
  logAuthAttempt(req, false, 'ALL_METHODS_FAILED');
  throw new UnauthorizedException();
}

export const authGuard = { apikey };
