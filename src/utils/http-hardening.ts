import { Cors } from '@config/env.config';

export type BodyLimits = {
  json: string;
  urlencoded: string;
};

export type HealthStatus = {
  status: 'ok' | 'degraded';
  uptime: number;
  version: string;
  databaseProvider: string;
  security: {
    apiKeySecure: boolean;
    issueCount: number;
  };
};

export function isCorsOriginAllowed(
  requestOrigin: string | undefined,
  allowedOrigins: Cors['ORIGIN'],
  nodeEnv = process.env.NODE_ENV,
): boolean {
  if (!requestOrigin) {
    return true;
  }

  const isLocalDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(requestOrigin);

  if (allowedOrigins.includes(requestOrigin)) {
    return true;
  }

  if (allowedOrigins.includes('*')) {
    return nodeEnv !== 'production';
  }

  return nodeEnv !== 'production' && isLocalDevelopmentOrigin;
}

export function getBodyLimits(env = process.env): BodyLimits {
  const defaultLimit = env.REQUEST_BODY_LIMIT || '136mb';

  return {
    json: env.REQUEST_JSON_BODY_LIMIT || defaultLimit,
    urlencoded: env.REQUEST_URLENCODED_BODY_LIMIT || defaultLimit,
  };
}

export function buildHealthStatus(args: {
  version: string;
  databaseProvider: string;
  apiKeySecure: boolean;
  securityIssueCount: number;
}): HealthStatus {
  return {
    status: args.apiKeySecure ? 'ok' : 'degraded',
    uptime: Math.round(process.uptime()),
    version: args.version,
    databaseProvider: args.databaseProvider,
    security: {
      apiKeySecure: args.apiKeySecure,
      issueCount: args.securityIssueCount,
    },
  };
}
