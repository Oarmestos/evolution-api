import { HttpStatus } from '@api/routes/http-status.enum';

import { BaseException } from './base.exception';

export class ForbiddenException extends BaseException {
  constructor(...objectError: any[]) {
    const message = objectError.length > 0 ? objectError[0] : undefined;
    super(HttpStatus.FORBIDDEN, 'Forbidden', message);
  }
}
