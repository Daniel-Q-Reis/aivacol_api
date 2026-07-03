export interface DomainExceptionParams {
  code: string;
  message: string;
  statusCode?: number;
}

export class DomainException extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(params: DomainExceptionParams) {
    super(params.message);
    this.name = 'DomainException';
    this.code = params.code;
    this.statusCode = params.statusCode ?? 400;
  }
}
