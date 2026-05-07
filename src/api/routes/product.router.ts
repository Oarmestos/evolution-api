import { RouterBroker } from '@api/abstract/abstract.router';
import { InstanceDto } from '@api/dto/instance.dto';
import { productController } from '@api/server.module';
import { ProductDto } from '@dto/product.dto';
import { productSchema } from '@validate/product.validate';
import { RequestHandler, Router } from 'express';
import multer from 'multer';

import { HttpStatus } from './index.router';

const upload = multer({ storage: multer.memoryStorage() });

export class ProductRouter extends RouterBroker {
  public readonly router: Router = Router();

  constructor(...guards: RequestHandler[]) {
    super();

    this.router
      .post(this.routerPath('upload'), ...guards, upload.single('file'), async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: {},
          ClassRef: InstanceDto,
          execute: (instance) => productController.uploadProductImage(instance, req.file as Express.Multer.File),
        });
        return res.status(HttpStatus.CREATED).json(response);
      })
      .post(this.routerPath('import'), ...guards, upload.single('file'), async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: {},
          ClassRef: InstanceDto,
          execute: (instance) => productController.importProducts(instance, req.file as Express.Multer.File),
        });
        return res.status(HttpStatus.CREATED).json(response);
      })
      .post(this.routerPath(''), ...guards, async (req, res) => {
        const response = await this.dataValidate<ProductDto>({
          request: req,
          schema: productSchema,
          ClassRef: InstanceDto,
          execute: (instance, data) => productController.createProduct(instance, data),
        });
        return res.status(HttpStatus.CREATED).json(response);
      })
      .get(this.routerPath(''), ...guards, async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: {},
          ClassRef: InstanceDto,
          execute: (instance) => productController.getProducts(instance),
        });
        return res.status(HttpStatus.OK).json(response);
      })
      .get(this.routerPath(':id'), ...guards, async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: {},
          ClassRef: InstanceDto,
          execute: (instance) => productController.getProduct(instance, req.params.id),
        });
        return res.status(HttpStatus.OK).json(response);
      })
      .put(this.routerPath(':id'), ...guards, async (req, res) => {
        const response = await this.dataValidate<Partial<ProductDto>>({
          request: req,
          schema: productSchema,
          ClassRef: InstanceDto,
          execute: (instance, data) => productController.updateProduct(instance, req.params.id, data),
        });
        return res.status(HttpStatus.OK).json(response);
      })
      .delete(this.routerPath(':id'), ...guards, async (req, res) => {
        const response = await this.dataValidate<any>({
          request: req,
          schema: {},
          ClassRef: InstanceDto,
          execute: (instance) => productController.deleteProduct(instance, req.params.id),
        });
        return res.status(HttpStatus.OK).json(response);
      });
  }
}
