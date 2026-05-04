export interface ExceptionPayload {
  status: number;
  error: string;
  message: any;
}

export class BaseException extends Error {
  public readonly status: number;
  public readonly error: string;

  constructor(status: number, error: string, message: any) {
    super(typeof message === 'string' ? message : JSON.stringify(message));
    this.status = status;
    this.error = error;
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, BaseException.prototype);
  }

  toJSON(): ExceptionPayload {
    return {
      status: this.status,
      error: this.error,
      message: this.message,
    };
  }
}
