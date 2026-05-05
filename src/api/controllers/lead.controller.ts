import { InstanceDto } from '@api/dto/instance.dto';
import { LeadService } from '@api/services/lead.service';

export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  private getInstanceId(instance: InstanceDto & { id?: string }) {
    return instance.id || instance.instanceId;
  }

  public async createFunnel(instance: InstanceDto, data: any) {
    return this.leadService.createFunnel(this.getInstanceId(instance), data);
  }

  public async getFunnels(instance: InstanceDto) {
    return this.leadService.getFunnels(this.getInstanceId(instance));
  }

  public async createStage(instance: InstanceDto, data: any) {
    return this.leadService.createStage(this.getInstanceId(instance), data);
  }

  public async createLead(instance: InstanceDto, data: any) {
    return this.leadService.createLead(this.getInstanceId(instance), data);
  }

  public async moveLead(instance: InstanceDto, leadId: string, newStageId: string) {
    return this.leadService.moveLead(this.getInstanceId(instance), leadId, newStageId);
  }
}
