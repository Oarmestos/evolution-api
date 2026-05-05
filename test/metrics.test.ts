import {
  escapePrometheusLabel,
  getClientIps,
  isMetricsIpAllowed,
  renderPrometheusMetrics,
  verifyMetricsBasicAuth,
} from '../src/utils/metrics';
import { describe, expect, it } from 'vitest';

function basicAuth(user: string, pass: string) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}

describe('metrics helpers', () => {
  it('normalizes client IPs from request sources and forwarded headers', () => {
    expect(getClientIps(['127.0.0.1', undefined, '10.0.0.1, 10.0.0.2', ['::1']])).toEqual([
      '127.0.0.1',
      '10.0.0.1',
      '10.0.0.2',
      '::1',
    ]);
  });

  it('allows metrics only for configured client IPs', () => {
    expect(isMetricsIpAllowed('10.0.0.1,127.0.0.1', ['127.0.0.1'])).toBe(true);
    expect(isMetricsIpAllowed('10.0.0.1', ['127.0.0.1'])).toBe(false);
    expect(isMetricsIpAllowed(undefined, ['127.0.0.1'])).toBe(true);
  });

  it('verifies basic auth without leaking configured credentials', () => {
    const metricsConfig = {
      ENABLED: true,
      AUTH_REQUIRED: true,
      USER: 'metrics',
      PASSWORD: 'secret-password',
    };

    expect(verifyMetricsBasicAuth(basicAuth('metrics', 'secret-password'), metricsConfig).ok).toBe(true);

    const failed = verifyMetricsBasicAuth(basicAuth('metrics', 'wrong'), metricsConfig);
    expect(failed).toMatchObject({ ok: false, status: 401, message: 'Invalid credentials' });
    expect(JSON.stringify(failed)).not.toContain('secret-password');
  });

  it('escapes Prometheus label values', () => {
    expect(escapePrometheusLabel('sales"team\\north\nline')).toBe('sales\\"team\\\\north\\nline');
  });

  it('renders metrics with escaped labels and no auth secrets', () => {
    const output = renderPrometheusMetrics({
      version: '2.3.7',
      clientName: 'client"one',
      serverUrl: 'https://api.example.com',
      instances: {
        'sales"north': {
          connectionStatus: { state: 'open' },
          integration: 'whatsapp\\baileys',
        },
        support: {
          connectionStatus: { state: 'close' },
          integration: 'meta',
        },
      },
    });

    expect(output).toContain('avri_instances_total 2');
    expect(output).toContain('clientName="client\\"one"');
    expect(output).toContain('instance="sales\\"north"');
    expect(output).toContain('integration="whatsapp\\\\baileys"');
    expect(output).toContain('avri_instance_up{instance="support",integration="meta"} 0');
    expect(output).not.toContain('secret-password');
  });
});
