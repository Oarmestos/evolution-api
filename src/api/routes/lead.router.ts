import { RouterBroker } from '@api/abstract/abstract.router';
import { InstanceDto } from '@api/dto/instance.dto';
import { leadController } from '@api/server.module';
import { RequestHandler, Router } from 'express';
import { JSONSchema7 } from 'json-schema';
import { v4 } from 'uuid';

import { HttpStatus } from './http-status.enum';

export const createFunnelSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
  },
  required: ['name'],
  additionalProperties: false,
};

export const createStageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    color: { type: 'string', minLength: 1 },
    order: { type: 'integer', minimum: 0 },
    funnelId: { type: 'string', minLength: 1 },
  },
  required: ['name', 'funnelId'],
  additionalProperties: false,
};

export const createLeadSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    value: { type: 'number', minimum: 0 },
    notes: { type: 'string' },
    stageId: { type: 'string', minLength: 1 },
    contactId: { type: 'string', minLength: 1 },
  },
  required: ['stageId', 'contactId'],
  additionalProperties: false,
};

export const moveLeadSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    newStageId: { type: 'string', minLength: 1 },
  },
  required: ['newStageId'],
  additionalProperties: false,
};

export class LeadRouter extends RouterBroker {
  public readonly router: Router = Router();

  constructor(...guards: RequestHandler[]) {
    super();

    this.router
      .post(this.routerPath('funnel'), ...guards, async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: createFunnelSchema,
          ClassRef: InstanceDto,
          execute: (instance, data) => leadController.createFunnel(instance, data),
        });
        return res.status(HttpStatus.CREATED).json(response);
      })
      .get(this.routerPath('funnels'), ...guards, async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: {},
          ClassRef: InstanceDto,
          execute: (instance) => leadController.getFunnels(instance),
        });
        return res.status(HttpStatus.OK).json(response);
      })
      .post(this.routerPath('stage'), ...guards, async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: createStageSchema,
          ClassRef: InstanceDto,
          execute: (instance, data) => leadController.createStage(instance, data),
        });
        return res.status(HttpStatus.CREATED).json(response);
      })
      .post(this.routerPath(''), ...guards, async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: createLeadSchema,
          ClassRef: InstanceDto,
          execute: (instance, data) => leadController.createLead(instance, data),
        });
        return res.status(HttpStatus.CREATED).json(response);
      })
      .patch(this.routerPath('move/:id'), ...guards, async (req, res) => {
        const leadId = req.params.id;
        const response = await this.dataValidate<any>({
          request: req,
          schema: moveLeadSchema,
          ClassRef: InstanceDto,
          execute: (instance, data) => leadController.moveLead(instance, leadId, data.newStageId),
        });
        return res.status(HttpStatus.OK).json(response);
      });
  }
}
