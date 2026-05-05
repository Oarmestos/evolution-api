import { RouterBroker } from '../src/api/abstract/abstract.router';
import { createLeadSchema, createStageSchema } from '../src/api/routes/lead.router';
import { describe, expect, it, vi } from 'vitest';

class TestDto {
  name?: string;
  Integration?: string;
  integration?: string;
  stageId?: string;
  contactId?: string;
  extra?: string;
}

class TestRouterBroker extends RouterBroker {}

function makeRequest(overrides: any = {}) {
  return {
    body: {},
    params: { instanceName: 'sales' },
    query: {},
    originalUrl: '/lead/sales',
    ...overrides,
  };
}

describe('RouterBroker', () => {
  it('passes validated body and instance params to the executor', async () => {
    const broker = new TestRouterBroker();
    const execute = vi.fn().mockResolvedValue({ ok: true });

    const result = await broker.dataValidate({
      request: makeRequest({
        body: { stageId: 'stage-1', contactId: 'contact-1' },
      }) as any,
      schema: createLeadSchema,
      ClassRef: TestDto,
      execute,
    });

    expect(result).toEqual({ ok: true });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ instanceName: 'sales' }),
      expect.objectContaining({ stageId: 'stage-1', contactId: 'contact-1' }),
    );
  });

  it('rejects invalid lead payloads with a Bad Request exception', async () => {
    const broker = new TestRouterBroker();

    await expect(
      broker.dataValidate({
        request: makeRequest({
          body: { stageId: '', contactId: 'contact-1', extra: 'not-allowed' },
        }) as any,
        schema: createLeadSchema,
        ClassRef: TestDto,
        execute: vi.fn(),
      }),
    ).rejects.toMatchObject({
      status: 400,
      error: 'Bad Request',
    });
  });

  it('normalizes uppercase Integration only for instance creation', async () => {
    const broker = new TestRouterBroker();
    const execute = vi.fn().mockResolvedValue({ ok: true });

    await broker.dataValidate({
      request: makeRequest({
        originalUrl: '/instance/create',
        body: { name: 'stage', Integration: 'WHATSAPP-BAILEYS' },
      }) as any,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          integration: { type: 'string' },
          Integration: { type: 'string' },
        },
      },
      ClassRef: TestDto,
      execute,
    });

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ integration: 'WHATSAPP-BAILEYS' }),
      expect.objectContaining({ integration: 'WHATSAPP-BAILEYS' }),
    );
  });

  it('rejects invalid lead stage schemas before execution', async () => {
    const broker = new TestRouterBroker();
    const execute = vi.fn();

    await expect(
      broker.dataValidate({
        request: makeRequest({
          body: { name: '', funnelId: 'funnel-1', order: -1 },
        }) as any,
        schema: createStageSchema,
        ClassRef: TestDto,
        execute,
      }),
    ).rejects.toMatchObject({
      status: 400,
      error: 'Bad Request',
    });

    expect(execute).not.toHaveBeenCalled();
  });
});
