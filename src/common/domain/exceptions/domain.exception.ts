export interface DomainExceptionParams {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export abstract class DomainException extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: Readonly<Record<string, unknown>>;

  protected constructor(params: DomainExceptionParams) {
    super(params.message);
    this.name = new.target.name;
    this.code = params.code;
    this.statusCode = params.statusCode ?? 400;
    this.details = params.details;
  }
}
