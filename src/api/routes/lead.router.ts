import { RouterBroker } from '@api/abstract/abstract.router';
import { InstanceDto } from '@api/dto/instance.dto';
import { leadController } from '@api/server.module';
import { RequestHandler, Router } from 'express';
import { JSONSchema7 } from 'json-schema';
import { v4 } from 'uuid';

import { HttpStatus } from './index.router';

export const createFunnelSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['name'],
};

export const createStageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    name: { type: 'string' },
    color: { type: 'string' },
    order: { type: 'integer' },
    funnelId: { type: 'string' },
  },
  required: ['name', 'funnelId'],
};

export const createLeadSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    value: { type: 'number' },
    notes: { type: 'string' },
    stageId: { type: 'string' },
    contactId: { type: 'string' },
  },
  required: ['stageId', 'contactId'],
};

export const moveLeadSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    newStageId: { type: 'string' },
  },
  required: ['newStageId'],
};

export class LeadRouter extends RouterBroker {
  public readonly router: Router = Router();

  constructor(...guards: RequestHandler[]) {
    super();

    this.router
      .post(this.routerPath('funnel'), ...guards, async (req, res) => {
        try {
          const response = await this.dataValidate<any>({
            request: req,
            schema: createFunnelSchema,
            ClassRef: InstanceDto,
            execute: (instance, data) => leadController.createFunnel(instance, data),
          });
          return res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
          console.log(error);
          return res.status(HttpStatus.BAD_REQUEST).json(error);
        }
      })
      .get(this.routerPath('funnels'), ...guards, async (req, res) => {
        try {
          const response = await this.dataValidate<any>({
            request: req,
            schema: {},
            ClassRef: InstanceDto,
            execute: (instance) => leadController.getFunnels(instance),
          });
          return res.status(HttpStatus.OK).json(response);
        } catch (error) {
          console.log(error);
          return res.status(HttpStatus.BAD_REQUEST).json(error);
        }
      })
      .post(this.routerPath('stage'), ...guards, async (req, res) => {
        try {
          const response = await this.dataValidate<any>({
            request: req,
            schema: createStageSchema,
            ClassRef: InstanceDto,
            execute: (instance, data) => leadController.createStage(instance, data),
          });
          return res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
          console.log(error);
          return res.status(HttpStatus.BAD_REQUEST).json(error);
        }
      })
      .post(this.routerPath(''), ...guards, async (req, res) => {
        try {
          const response = await this.dataValidate<any>({
            request: req,
            schema: createLeadSchema,
            ClassRef: InstanceDto,
            execute: (instance, data) => leadController.createLead(instance, data),
          });
          return res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
          console.log(error);
          return res.status(HttpStatus.BAD_REQUEST).json(error);
        }
      })
      .patch(this.routerPath('move/:id'), ...guards, async (req, res) => {
        try {
          const leadId = req.params.id;
          const response = await this.dataValidate<any>({
            request: req,
            schema: moveLeadSchema,
            ClassRef: InstanceDto,
            execute: (instance, data) => leadController.moveLead(instance, leadId, data.newStageId),
          });
          return res.status(HttpStatus.OK).json(response);
        } catch (error) {
          console.log(error);
          return res.status(HttpStatus.BAD_REQUEST).json(error);
        }
      });
  }
}
