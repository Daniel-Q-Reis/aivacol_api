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
  VEHICLE_NOT_FOUND: {
    code: 'VEHICLE_NOT_FOUND',
    statusCode: 404,
    message: 'Veículo não encontrado',
  },
  MODEL_NOT_FOUND: {
    code: 'MODEL_NOT_FOUND',
    statusCode: 404,
    message: 'Modelo não encontrado',
  },
  BRAND_NOT_FOUND: {
    code: 'BRAND_NOT_FOUND',
    statusCode: 404,
    message: 'Marca não encontrada',
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    statusCode: 404,
    message: 'Usuário não encontrado',
  },
  DUPLICATE_LICENSE_PLATE: {
    code: 'DUPLICATE_LICENSE_PLATE',
    statusCode: 409,
    message: 'Placa já cadastrada',
  },
  DUPLICATE_CHASSIS: {
    code: 'DUPLICATE_CHASSIS',
    statusCode: 409,
    message: 'Chassi já cadastrado',
  },
  DUPLICATE_RENAVAM: {
    code: 'DUPLICATE_RENAVAM',
    statusCode: 409,
    message: 'Renavam já cadastrado',
  },
  DUPLICATE_MODEL_NAME: {
    code: 'DUPLICATE_MODEL_NAME',
    statusCode: 409,
    message: 'Modelo já cadastrado para esta marca',
  },
  DUPLICATE_BRAND_NAME: {
    code: 'DUPLICATE_BRAND_NAME',
    statusCode: 409,
    message: 'Marca já cadastrada',
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
