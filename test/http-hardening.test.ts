import { buildHealthStatus, getBodyLimits, isCorsOriginAllowed } from '../src/utils/http-hardening';
import { describe, expect, it } from 'vitest';

describe('http hardening helpers', () => {
  it('allows wildcard CORS only outside production', () => {
    expect(isCorsOriginAllowed('https://example.com', ['*'], 'development')).toBe(true);
    expect(isCorsOriginAllowed('https://example.com', ['*'], 'production')).toBe(false);
  });

  it('allows localhost origins only outside production unless explicitly configured', () => {
    expect(isCorsOriginAllowed('http://localhost:3000', ['https://app.example.com'], 'development')).toBe(true);
    expect(isCorsOriginAllowed('http://localhost:3000', ['https://app.example.com'], 'production')).toBe(false);
    expect(isCorsOriginAllowed('http://localhost:3000', ['http://localhost:3000'], 'production')).toBe(true);
  });

  it('allows requests without Origin headers', () => {
    expect(isCorsOriginAllowed(undefined, ['https://app.example.com'], 'production')).toBe(true);
  });

  it('reads configurable body limits with backwards-compatible defaults', () => {
    expect(getBodyLimits({} as any)).toEqual({ json: '136mb', urlencoded: '136mb' });
    expect(
      getBodyLimits({
        REQUEST_BODY_LIMIT: '20mb',
        REQUEST_JSON_BODY_LIMIT: '10mb',
      } as any),
    ).toEqual({ json: '10mb', urlencoded: '20mb' });
  });

  it('builds health status without exposing issue details or secrets', () => {
    const health = buildHealthStatus({
      version: '2.3.7',
      databaseProvider: 'postgresql',
      apiKeySecure: false,
      securityIssueCount: 2,
    });

    expect(health).toMatchObject({
      status: 'degraded',
      version: '2.3.7',
      databaseProvider: 'postgresql',
      security: {
        apiKeySecure: false,
        issueCount: 2,
      },
    });
    expect(JSON.stringify(health)).not.toContain('avri_secret_key');
  });
});
