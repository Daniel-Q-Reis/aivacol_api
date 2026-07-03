export interface ErrorCatalogEntry {
  code: string;
  statusCode: number;
  message: string;
}

export const ERROR_CATALOG = {
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    statusCode: 401,
    message: 'Nickname ou senha inválidos',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    statusCode: 401,
    message: 'Token ausente ou inválido',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    statusCode: 403,
    message: 'Você não tem permissão para este recurso',
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    message: 'Limite de requisições excedido, tente novamente em instantes',
  },
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
    message: 'Erro interno do servidor',
  },
} as const satisfies Record<string, ErrorCatalogEntry>;

export type ErrorCode = keyof typeof ERROR_CATALOG;
