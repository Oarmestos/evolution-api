import { HttpStatus } from '@api/routes/http-status.enum';

import { BaseException } from './base.exception';

export class BadRequestException extends BaseException {
  constructor(...objectError: any[]) {
    const message = objectError.length > 0 ? objectError[0] : undefined;
    super(HttpStatus.BAD_REQUEST, 'Bad Request', message);
  }
}
