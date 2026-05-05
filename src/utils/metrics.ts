import { Metrics } from '@config/env.config';
import { timingSafeEqual } from 'crypto';

export type MetricsInstance = {
  connectionStatus?: {
    state?: string;
  };
  integration?: string;
};

export type MetricsRenderInput = {
  version: string;
  clientName: string;
  serverUrl: string;
  instances: Record<string, MetricsInstance>;
};

export function escapePrometheusLabel(value: unknown): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\"');
}

export function getClientIps(values: Array<string | string[] | undefined>): string[] {
  return values
    .flatMap((ip) => (Array.isArray(ip) ? ip : String(ip || '').split(',')))
    .map((ip) => ip.trim())
    .filter(Boolean);
}

export function isMetricsIpAllowed(allowedIps: string | undefined, clientIps: string[]): boolean {
  const allowed = allowedIps?.split(',').map((ip) => ip.trim()) || ['127.0.0.1'];

  return allowed.some((ip) => clientIps.includes(ip));
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

export function verifyMetricsBasicAuth(authHeader: string | undefined, metricsConfig: Metrics) {
  if (!metricsConfig.USER || !metricsConfig.PASSWORD) {
    return { ok: false, status: 500, message: 'Metrics authentication not configured' };
  }

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { ok: false, status: 401, message: 'Authentication required' };
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const separatorIndex = credentials.indexOf(':');

  if (separatorIndex < 0) {
    return { ok: false, status: 401, message: 'Invalid credentials' };
  }

  const user = credentials.slice(0, separatorIndex);
  const pass = credentials.slice(separatorIndex + 1);

  if (!safeCompare(user, metricsConfig.USER) || !safeCompare(pass, metricsConfig.PASSWORD)) {
    return { ok: false, status: 401, message: 'Invalid credentials' };
  }

  return { ok: true, status: 200, message: 'OK' };
}

export function renderPrometheusMetrics(input: MetricsRenderInput): string {
  const lines: string[] = [];
  const instanceEntries = Object.entries(input.instances || {});

  lines.push('# HELP avri_environment_info Environment information');
  lines.push('# TYPE avri_environment_info gauge');
  lines.push(
    `avri_environment_info{version="${escapePrometheusLabel(input.version)}",clientName="${escapePrometheusLabel(
      input.clientName || 'unknown',
    )}",serverUrl="${escapePrometheusLabel(input.serverUrl || '')}"} 1`,
  );

  lines.push('# HELP avri_instances_total Total number of instances');
  lines.push('# TYPE avri_instances_total gauge');
  lines.push(`avri_instances_total ${instanceEntries.length}`);

  lines.push('# HELP avri_instance_up 1 if instance state is open, else 0');
  lines.push('# TYPE avri_instance_up gauge');
  lines.push('# HELP avri_instance_state Instance state as a labelled metric');
  lines.push('# TYPE avri_instance_state gauge');

  for (const [name, instance] of instanceEntries) {
    const state = instance?.connectionStatus?.state || 'unknown';
    const integration = instance?.integration || '';
    const up = state === 'open' ? 1 : 0;

    lines.push(
      `avri_instance_up{instance="${escapePrometheusLabel(name)}",integration="${escapePrometheusLabel(
        integration,
      )}"} ${up}`,
    );
    lines.push(
      `avri_instance_state{instance="${escapePrometheusLabel(name)}",integration="${escapePrometheusLabel(
        integration,
      )}",state="${escapePrometheusLabel(state)}"} 1`,
    );
  }

  return lines.join('\n') + '\n';
}
