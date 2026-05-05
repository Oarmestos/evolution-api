import { LeadService } from '../src/api/services/lead.service';
import { describe, expect, it, vi } from 'vitest';

function makePrismaMock() {
  return {
    instance: {
      findUnique: vi.fn(),
    },
    leadFunnel: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    leadStage: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    contact: {
      findFirst: vi.fn(),
    },
    lead: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
}

function makeWaMonitorMock() {
  return {
    eventEmitter: {
      emit: vi.fn(),
    },
  };
}

describe('LeadService', () => {
  it('creates stages only in funnels from the current instance', async () => {
    const prisma = makePrismaMock();
    prisma.leadFunnel.findFirst.mockResolvedValue({ id: 'funnel-1', instanceId: 'instance-1' });
    prisma.leadStage.create.mockResolvedValue({ id: 'stage-1' });

    const service = new LeadService(prisma as any, makeWaMonitorMock() as any);

    await service.createStage('instance-1', {
      name: 'Qualified',
      funnelId: 'funnel-1',
      order: 1,
    });

    expect(prisma.leadFunnel.findFirst).toHaveBeenCalledWith({
      where: { id: 'funnel-1', instanceId: 'instance-1' },
    });
  });

  it('requires lead contacts to belong to the current instance', async () => {
    const prisma = makePrismaMock();
    prisma.leadStage.findFirst.mockResolvedValue({ id: 'stage-1' });
    prisma.contact.findFirst.mockResolvedValue(null);

    const service = new LeadService(prisma as any, makeWaMonitorMock() as any);

    await expect(
      service.createLead('instance-1', {
        stageId: 'stage-1',
        contactId: 'contact-from-other-instance',
      }),
    ).rejects.toMatchObject({
      status: 404,
      error: 'Not Found',
    });

    expect(prisma.contact.findFirst).toHaveBeenCalledWith({
      where: { id: 'contact-from-other-instance', instanceId: 'instance-1' },
    });
    expect(prisma.lead.create).not.toHaveBeenCalled();
  });

  it('stores leads with the current instance id', async () => {
    const prisma = makePrismaMock();
    prisma.instance.findUnique.mockResolvedValue({ id: 'instance-1', name: 'sales' });
    prisma.leadStage.findFirst.mockResolvedValue({ id: 'stage-1' });
    prisma.contact.findFirst.mockResolvedValue({ id: 'contact-1', instanceId: 'instance-1' });
    prisma.lead.create.mockResolvedValue({ id: 'lead-1' });

    const waMonitor = makeWaMonitorMock();
    const service = new LeadService(prisma as any, waMonitor as any);

    await service.createLead('instance-1', {
      stageId: 'stage-1',
      contactId: 'contact-1',
      value: 50,
      notes: 'Interested',
    });

    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          instanceId: 'instance-1',
          stageId: 'stage-1',
          contactId: 'contact-1',
        }),
      }),
    );
    expect(waMonitor.eventEmitter.emit).toHaveBeenCalledWith(
      'lead.event',
      expect.objectContaining({
        instanceName: 'sales',
        event: 'lead.created',
      }),
    );
  });
});
