import { PrismaRepository } from '@api/repository/repository.service';
import { Logger } from '@config/logger.config';
import { NotFoundException } from '@exceptions';

export class LeadService {
  constructor(private readonly prisma: PrismaRepository) {}
  private readonly logger = new Logger('LeadService');

  public async createFunnel(instanceId: string, data: any) {
    return this.prisma.leadFunnel.create({
      data: {
        name: data.name,
        description: data.description,
        instanceId,
      },
    });
  }

  public async getFunnels(instanceId: string) {
    return this.prisma.leadFunnel.findMany({
      where: { instanceId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            leads: {
              include: {
                Contact: true,
              },
            },
          },
        },
      },
    });
  }

  public async createStage(instanceId: string, data: any) {
    const funnel = await this.prisma.leadFunnel.findFirst({
      where: { id: data.funnelId, instanceId },
    });
    if (!funnel) throw new NotFoundException('Funnel not found');

    return this.prisma.leadStage.create({
      data: {
        name: data.name,
        color: data.color,
        order: data.order,
        funnelId: data.funnelId,
      },
    });
  }

  public async createLead(instanceId: string, data: any) {
    const stage = await this.prisma.leadStage.findFirst({
      where: { id: data.stageId, Funnel: { instanceId } },
    });
    if (!stage) throw new NotFoundException('Stage not found');

    return this.prisma.lead.create({
      data: {
        value: data.value || 0,
        notes: data.notes || '',
        stageId: data.stageId,
        contactId: data.contactId,
        instanceId,
      },
      include: {
        Contact: true,
      },
    });
  }

  public async moveLead(instanceId: string, leadId: string, newStageId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, instanceId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const stage = await this.prisma.leadStage.findFirst({
      where: { id: newStageId, Funnel: { instanceId } },
    });
    if (!stage) throw new NotFoundException('Target stage not found');

    return this.prisma.lead.update({
      where: { id: leadId },
      data: { stageId: newStageId },
      include: { Contact: true },
    });
  }
}
