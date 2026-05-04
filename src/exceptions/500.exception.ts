import { HttpStatus } from '@api/routes/http-status.enum';

import { BaseException } from './base.exception';

export class InternalServerErrorException extends BaseException {
  constructor(...objectError: any[]) {
    const message = objectError.length > 0 ? objectError[0] : undefined;
    super(HttpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', message);
  }
}
