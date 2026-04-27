import { InstanceDto } from '@api/dto/instance.dto';
import { LeadService } from '@api/services/lead.service';

export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  public async createFunnel(instance: InstanceDto, data: any) {
    return this.leadService.createFunnel(instance.instanceId, data);
  }

  public async getFunnels(instance: InstanceDto) {
    return this.leadService.getFunnels(instance.instanceId);
  }

  public async createStage(instance: InstanceDto, data: any) {
    return this.leadService.createStage(instance.instanceId, data);
  }

  public async createLead(instance: InstanceDto, data: any) {
    return this.leadService.createLead(instance.instanceId, data);
  }

  public async moveLead(instance: InstanceDto, leadId: string, newStageId: string) {
    return this.leadService.moveLead(instance.instanceId, leadId, newStageId);
  }
}
