# Plano de Implementação — Aivacol Fleet Management API

> Backend pronto para produção com Clean Architecture estrita, NestJS 10+, TypeORM, SQL Server, Redis, RabbitMQ, MongoDB.

---

## ⚠️ PROTOCOLO DE INÍCIO DE SESSÃO (OBRIGATÓRIO)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Execute NESTA ORDEM antes de qualquer outra ação:

  1. Leia  →  MASTER.md
  2. Leia  →  implementation_plan.md  (este arquivo)
  3. Leia  →  task.md
  4. Leia  →  struct.md
  5. Leia  →  ACHIEVEMENTS.md
  6. Execute →  git status
  7. Execute →  git log --oneline -5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Decisões Técnicas Fechadas

> [!IMPORTANT]
> **Decisões técnicas aprovadas antes da execução:**
> 1. O projeto será inicializado com `@nestjs/cli` via Docker (sem necessidade de Node.js local)
> 2. `ioredis` será usado diretamente (em vez de `cache-manager`) para controle fino de invalidação por pattern
> 3. `@golevelup/nestjs-rabbitmq` será o pacote para RabbitMQ (mais NestJS-nativo que `@nestjs/microservices`)
> 4. Entidades de domínio serão classes TypeScript puras, separadas das ORM Entities do TypeORM
> 5. `EventEmitter2` será o mecanismo de desacoplamento entre CRUD e listeners de auditoria/mensageria
> 6. Benchmark usará Autocannon (Node.js nativo, mais simples que k6 em Docker)
> 7. Não há questões pendentes nesta fase de planejamento.

> [!WARNING]
> **Todo o desenvolvimento é via Docker Compose.** Nenhum `npm install` será executado no host.
> O NestJS CLI será executado dentro do container. Scripts de conveniência em PowerShell serão fornecidos.

---

## ✅ Decisões Resolvidas (aprovadas em 2026-07-02)

> [!NOTE]
> Todas as questões abertas foram resolvidas com base nas melhores práticas para 2025-2026:

| # | Questão | Decisão | Justificativa |
|---|---|---|---|
| 1 | **Relacionamento `models ↔ brands`** | ✅ `models` terá FK `brand_id` → `brands` | O `objetivos.md` exige *"Associar models a uma brand"*. Relacionamento natural do domínio (ex: "Gol" pertence a "Volkswagen"). |
| 2 | **Seed de veículos** | ✅ Dados brasileiros realistas | Placas Mercosul (`ABC1D23`), marcas nacionais (Fiat, VW, Chevrolet, Toyota), modelos reais (Argo, Gol, Onix, Corolla). Demonstra domínio do negócio. |
| 3 | **Autenticação** | ✅ Login por `nickname + password` | O `objetivos.md` referencia o seed como `aivacol` (nickname). Mais prático para sistemas internos de frota. |
| 4 | **Estratégia de delete** | ✅ Soft delete no SQL Server + auditoria MongoDB | Mantém histórico operacional no relacional, reforça compliance (ex: LGPD e trilhas de auditoria), e complementa rastreabilidade no MongoDB sem perda de contexto do dado principal. |
| 5 | **Users** | ✅ Consulta, autenticação e relacionamento via `created_by` | O desafio exige `users` e seus relacionamentos, mas não lista Gestão de Users como CRUD funcional obrigatório. Evita expor mutação de usuários fora do escopo. |
| 6 | **Auditoria** | ✅ Global para interações de serviço | MongoDB deve registrar autenticação, consultas e mutações de Vehicles, Models, Brands e Users. RabbitMQ permanece restrito a eventos de veículos. |

---

## Proposed Changes

A implementação será dividida em **Fase 0 + 8 fases** sequenciais. Cada fase produz código funcional e testável.

---

### Definition of Done por Fase

Cada fase só pode ser marcada como concluída quando entregar:

| Item | Critério objetivo |
|---|---|
| Artefato | Arquivos previstos criados/alterados e registrados no `struct.md` |
| Evidência | Saída do comando de validação registrada no `ACHIEVEMENTS.md` |
| Qualidade | `lint`, `lint:fix` e `typecheck` passando quando já houver projeto Node/Nest |
| Testes | Testes aplicáveis da fase passando; cobertura verificada a partir da Fase 7 |
| Git | `git status` revisado e commit semântico criado ao final da fase |

---

### Fase 0 — Preparação do Repositório

Passo inicial executado uma única vez antes da Fase 1.

- Verificar se o diretório atual já é um repositório Git.
- Se `git status` retornar `fatal: not a git repository`, executar `git init`.
- Após `git init`, criar o primeiro commit dos arquivos de planejamento existentes.
- Não adicionar `git init` ao protocolo recorrente de início de sessão.

---

### Fase 1 — Scaffolding e Infraestrutura Docker

Setup completo do ambiente sem código de negócio.

#### [NEW] `docker-compose.yml`
Docker Compose com 5 serviços:
- **app**: Node.js 18 Alpine + NestJS (com hot-reload via volumes)
- **sqlserver**: `mcr.microsoft.com/mssql/server:2022-latest` (porta 1433)
- **redis**: `redis:7-alpine` (porta 6379)
- **rabbitmq**: `rabbitmq:3-management-alpine` (portas 5672, 15672)
- **mongodb**: `mongo:7` (porta 27017)

Health checks em todos os serviços. Named volumes para persistência. Rede interna `aivacol-network`.

#### [NEW] `Dockerfile`
Multistage build:
- **Stage 1 (dev)**: `node:18-alpine`, instala deps, monta volume para hot-reload
- **Stage 2 (builder)**: compila TypeScript
- **Stage 3 (production)**: imagem mínima com apenas `dist/` e `node_modules` de produção

#### [NEW] `.env` / `.env.example`
Variáveis de ambiente para todos os serviços (conforme `MASTER.md` seção 5.4).

#### [NEW] `.dockerignore`
Ignora `node_modules`, `dist`, `.git`, `*.md` (exceto README).

#### [NEW] `scripts/dev.ps1`
Script PowerShell para `docker compose up --build -d` com mensagens coloridas.

#### [NEW] `scripts/stop.ps1`
Para e remove containers.

#### [NEW] `scripts/logs.ps1`
Tail dos logs da aplicação.

#### [NEW] `scripts/test.ps1`
Executa testes unitários dentro do container.

#### [NEW] `scripts/test-e2e.ps1`
Executa testes e2e dentro do container.

#### [NEW] `scripts/lint.ps1`
Executa lint + lint:fix + typecheck dentro do container.

#### [NEW] `scripts/migrate.ps1`
Executa migrations do TypeORM dentro do container.

#### [NEW] `scripts/seed.ps1`
Executa seed do banco dentro do container.

#### [NEW] `scripts/benchmark.ps1`
Executa benchmark Autocannon dentro do container.

---

### Fase 2 — Projeto NestJS Base + Configuração

Inicialização do projeto NestJS e configuração de todos os módulos de infraestrutura.

#### [NEW] Projeto NestJS (via CLI no container)
```powershell
docker compose run --rm app npx @nestjs/cli new . --package-manager npm --skip-git --skip-install --strict
```

Observação: manter execução não interativa no container para evitar bloqueios em ambiente headless.

#### [NEW] `src/main.ts`
Bootstrap com:
- `ValidationPipe` global
- Swagger setup em `/api/docs`
- CORS configurado
- Prefixo `/api/v1`
- Logger do NestJS

#### [NEW] `src/app.module.ts`
Root module importando:
- `ConfigModule.forRoot()` (global)
- `TypeOrmModule.forRootAsync()` (SQL Server)
- `MongooseModule.forRootAsync()` (MongoDB)
- `EventEmitterModule.forRoot()` (eventos internos)
- Módulos de feature (vehicles, models, brands, users, auth)

#### [NEW] `src/config/database.config.ts`
TypeORM config factory (SQL Server via `mssql`).

#### [NEW] `src/config/cache.config.ts`
Redis config factory (host, port, TTL do `.env`).

#### [NEW] `src/config/messaging.config.ts`
RabbitMQ config factory.

#### [NEW] `src/config/audit.config.ts`
MongoDB config factory.

#### [NEW] `src/config/auth.config.ts`
JWT config factory (secret, expiresIn do `.env`).

#### [NEW] `.eslintrc.js` + `.prettierrc`
ESLint com `@typescript-eslint`, integração Prettier.

#### [NEW] `jest.config.ts` + `jest-e2e.config.ts`
Configuração Jest com threshold de 90%.

#### [NEW] `tsconfig.json` / `tsconfig.build.json`
TypeScript com strict mode, paths aliases.

#### [NEW] `package.json` scripts
```json
{
  "lint": "eslint \"{src,test}/**/*.ts\"",
  "lint:fix": "eslint \"{src,test}/**/*.ts\" --fix",
  "typecheck": "tsc --noEmit",
  "test": "jest",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config jest-e2e.config.ts"
}
```

---

### Fase 3 — Common (Cross-Cutting Concerns)

Módulo de infraestrutura compartilhada.

#### [NEW] `src/common/filters/global-exception.filter.ts`
`ExceptionFilter` customizado:
- Captura `HttpException`, `DomainException`, `Error`
- Retorna resposta padronizada: `{ statusCode, message, timestamp, path, correlationId }`
- Loga stack-trace no console (visível no Docker)

#### [NEW] `src/common/interceptors/logging.interceptor.ts`
Interceptor global que registra:
- Método HTTP, Rota, User ID, Tempo de execução (ms), Status Code

#### [NEW] `src/common/middleware/correlation-id.middleware.ts`
Middleware que:
- Gera UUID v4 se não vier no header `X-Correlation-ID`
- Propaga via `AsyncLocalStorage` ou `cls-hooked`

#### [NEW] `src/common/decorators/current-user.decorator.ts`
Custom decorator `@CurrentUser()` para extrair user do JWT.

#### [NEW] `src/common/guards/jwt-auth.guard.ts`
Guard global que protege todas as rotas (exceto as marcadas com `@Public()`).

#### [NEW] `src/common/decorators/public.decorator.ts`
Decorator `@Public()` para marcar rotas abertas (login, health).

---

### Fase 4 — Domain Layer (Entidades, Portas, Exceções)

Camada de domínio PURA — zero imports de framework.

#### [NEW] `src/modules/vehicles/domain/entities/vehicle.entity.ts`
Classe TypeScript pura com validação de negócio (placa, chassi, renavam, ano).

#### [NEW] `src/modules/vehicles/domain/interfaces/vehicle-repository.interface.ts`
Interface `IVehicleRepository` + Symbol `VEHICLE_REPOSITORY`.

#### [NEW] `src/modules/models/domain/entities/model.entity.ts`
Entidade de domínio Model.

#### [NEW] `src/modules/models/domain/interfaces/model-repository.interface.ts`
Interface `IModelRepository` + Symbol `MODEL_REPOSITORY`.

#### [NEW] `src/modules/brands/domain/entities/brand.entity.ts`
Entidade de domínio Brand.

#### [NEW] `src/modules/brands/domain/interfaces/brand-repository.interface.ts`
Interface `IBrandRepository` + Symbol `BRAND_REPOSITORY`.

#### [NEW] `src/modules/users/domain/entities/user.entity.ts`
Entidade de domínio User.

#### [NEW] `src/modules/users/domain/interfaces/user-repository.interface.ts`
Interface `IUserRepository` + Symbol `USER_REPOSITORY`.

#### [NEW] `src/common/domain/exceptions/domain.exception.ts`
Base `DomainException` (não-HTTP).

#### [NEW] `src/common/domain/exceptions/entity-not-found.exception.ts`
`EntityNotFoundException extends DomainException`.

#### [NEW] `src/common/domain/exceptions/business-rule-violation.exception.ts`
`BusinessRuleViolationException extends DomainException`.

#### [NEW] `src/common/domain/interfaces/cache-service.interface.ts`
Interface `ICacheService` + Symbol `CACHE_SERVICE`.

#### [NEW] `src/common/domain/interfaces/event-publisher.interface.ts`
Interface `IEventPublisher` + Symbol `EVENT_PUBLISHER`.

#### [NEW] `src/common/domain/interfaces/audit-logger.interface.ts`
Interface `IAuditLogger` + Symbol `AUDIT_LOGGER`.

---

### Fase 5 — Infrastructure Layer (Adapters)

Implementação concreta das portas do domínio.

#### [NEW] `src/modules/vehicles/infrastructure/persistence/entities/vehicle.orm-entity.ts`
Entidade TypeORM com decorators `@Entity`, `@Column`, `@ManyToOne`, `@CreateDateColumn`, etc.

#### [NEW] `src/modules/vehicles/infrastructure/persistence/repositories/typeorm-vehicle.repository.ts`
Implementação de `IVehicleRepository` usando `Repository<VehicleOrmEntity>`.

#### [NEW] `src/modules/models/infrastructure/persistence/entities/model.orm-entity.ts`
Entidade TypeORM para `models`. FK `brand_id` para `brands`.

#### [NEW] `src/modules/models/infrastructure/persistence/repositories/typeorm-model.repository.ts`
Implementação de `IModelRepository`.

#### [NEW] `src/modules/brands/infrastructure/persistence/entities/brand.orm-entity.ts`
Entidade TypeORM para `brands`.

#### [NEW] `src/modules/brands/infrastructure/persistence/repositories/typeorm-brand.repository.ts`
Implementação de `IBrandRepository`.

#### [NEW] `src/modules/users/infrastructure/persistence/entities/user.orm-entity.ts`
Entidade TypeORM para `users` (com campo `password_hash`).

#### [NEW] `src/modules/users/infrastructure/persistence/repositories/typeorm-user.repository.ts`
Implementação de `IUserRepository`.

#### [NEW] `src/infrastructure/cache/redis-cache.service.ts`
Implementação de `ICacheService` com `ioredis`. Métodos: `get`, `set`, `del`, `delByPattern`.

#### [NEW] `src/infrastructure/messaging/rabbitmq-event-publisher.ts`
Implementação de `IEventPublisher` com `@golevelup/nestjs-rabbitmq`.

#### [NEW] `src/infrastructure/audit/schemas/audit-log.schema.ts`
Schema Mongoose para logs de auditoria.

#### [NEW] `src/infrastructure/audit/mongo-audit-logger.ts`
Implementação de `IAuditLogger` com Mongoose.

#### [NEW] `src/infrastructure/database/migrations/`
Migrations TypeORM:
1. `CreateUsersTable`
2. `CreateBrandsTable`
3. `CreateModelsTable` (com FK para `brands`)
4. `CreateVehiclesTable` (com FK para `models`)

#### [NEW] `src/infrastructure/database/seeds/seed.ts`
Script de seed que cria:
- Usuário padrão `aivacol`
- Brands de exemplo
- Models de exemplo
- Vehicles de exemplo (dados do `seed_vehicles.json`)

#### [NEW] `seed_vehicles.json`
Arquivo JSON na raiz com dados mock de veículos.

---

### Fase 6 — Application + Presentation Layer (CRUD + Auth)

Use Cases, DTOs, Controllers, Swagger.

Todos os controllers devem documentar contratos de entrada, parâmetros e respostas com Swagger de forma verificável: `@ApiBody` em rotas com body, `@ApiParam` em rotas com `:id`, respostas de sucesso `200/201`, `@ApiResponse(401)` em rotas protegidas e erros `400/404` quando aplicáveis.

#### [NEW] `src/modules/auth/application/services/auth.service.ts`
Serviço de autenticação: `login(nickname, password) → { access_token }`.

#### [NEW] `src/modules/auth/application/dtos/login.dto.ts`
DTO com `nickname` e `password`, validado com `class-validator`.

#### [NEW] `src/modules/auth/infrastructure/strategies/jwt.strategy.ts`
Passport JWT Strategy para validar tokens.

#### [NEW] `src/modules/auth/presentation/controllers/auth.controller.ts`
`POST /api/v1/auth/login` — rota pública.

---

#### [NEW] `src/modules/vehicles/application/services/vehicle.service.ts`
Use case completo:
- `create(dto, userId)` — cria veículo, invalida cache, emite evento
- `findAll(query)` — paginação (`page`, `limit`, `sort`, `order`), busca do cache, se miss busca do DB e cacheia
- `findById(id)` — busca do cache, se miss busca do DB e cacheia
- `update(id, dto, userId)` — atualiza, invalida cache, emite evento
- `delete(id, userId)` — soft delete, invalida cache, emite evento
- Todos os métodos emitem `audit.service_interaction`

#### [NEW] `src/modules/vehicles/application/dtos/create-vehicle.dto.ts`
DTO com validação via `class-validator` + decorators Swagger.

#### [NEW] `src/modules/vehicles/application/dtos/update-vehicle.dto.ts`
`PartialType(CreateVehicleDto)`.

#### [NEW] `src/modules/vehicles/application/mappers/vehicle.mapper.ts`
Mapper bidirecional: Domain ↔ ORM Entity ↔ Response DTO.

#### [NEW] `src/modules/vehicles/presentation/controllers/vehicle.controller.ts`
Controller REST com decorators Swagger completos:
- `GET /api/v1/vehicles` — listar com paginação
- `GET /api/v1/vehicles/:id` — buscar por ID
- `POST /api/v1/vehicles` — criar
- `PATCH /api/v1/vehicles/:id` — atualizar
- `DELETE /api/v1/vehicles/:id` — remover (soft delete)

#### [NEW] `src/infrastructure/audit/listeners/service-audit.listener.ts`
Listener `@OnEvent('audit.service_interaction')` que grava no MongoDB todas as interações de serviço via `IAuditLogger`. Cobre autenticação, consultas e mutações de Vehicles, Models, Brands e Users. **Nunca relança exceção.**

#### [NEW] `src/modules/vehicles/infrastructure/listeners/vehicle-messaging.listener.ts`
Listener `@OnEvent('vehicle.*')` que publica no RabbitMQ via `IEventPublisher`. **Nunca relança exceção.**

---

> **Models, Brands e Users seguem a mesma estrutura de Vehicle**, com as seguintes diferenças:
> - **Models**: CRUD + associação com brand (`brand_id`)
> - **Brands**: CRUD simples
> - **Users**: Consulta protegida, autenticação e relacionamento via `created_by` (sem CRUD público completo)
> - **Models, Brands e Users**: Sem mensageria RabbitMQ; auditoria global obrigatória via `audit.service_interaction`

---

### Fase 7 — Testes (≥ 90% coverage)

#### Testes Unitários (`test/unit/` ou colocados junto aos arquivos `*.spec.ts`)

| Arquivo de teste | O que testa |
|---|---|
| `vehicle.service.spec.ts` | Todos os use cases de Vehicle (mock de repo, cache, events) |
| `model.service.spec.ts` | Todos os use cases de Model |
| `brand.service.spec.ts` | Todos os use cases de Brand |
| `auth.service.spec.ts` | Login, validação de credenciais, geração de JWT |
| `vehicle.entity.spec.ts` | Validações de domínio (placa, chassi, renavam, ano) |
| `model.entity.spec.ts` | Validações de domínio |
| `brand.entity.spec.ts` | Validações de domínio |
| `redis-cache.service.spec.ts` | Mock ioredis, operações de cache |
| `mongo-audit-logger.spec.ts` | Mock mongoose, operações de auditoria |
| `rabbitmq-event-publisher.spec.ts` | Mock amqplib, publicação de eventos |
| `global-exception.filter.spec.ts` | Tradução de exceções para respostas HTTP |
| `logging.interceptor.spec.ts` | Log de requisições |
| `service-audit.listener.spec.ts` | Listener global de auditoria não relança exceção |
| `vehicle-messaging.listener.spec.ts` | Listener não relança exceção |

#### Testes E2E (`test/e2e/`)

| Arquivo de teste | O que testa |
|---|---|
| `auth.e2e-spec.ts` | Login com credenciais válidas/inválidas, token expirado |
| `vehicles.e2e-spec.ts` | CRUD completo via HTTP, validações, 401 sem token |
| `models.e2e-spec.ts` | CRUD completo via HTTP |
| `brands.e2e-spec.ts` | CRUD completo via HTTP |
| `health.e2e-spec.ts` | Health check endpoint |

---

### Fase 8 — Documentação, Benchmark e Finalização

#### [NEW] `README.md`
README completo com:
- Visão geral do projeto
- Arquitetura (diagrama)
- Tecnologias
- Pré-requisitos (Docker Desktop, Git, PowerShell)
- Como rodar (`docker compose up`)
- Como rodar testes
- Como rodar benchmark
- Endpoints disponíveis
- Seção `✅ Checklist do Desafio` (tabela)
- Seção `🚀 Diferenciais de Engenharia`

#### [NEW] `docs/adr/ADR-001-clean-architecture.md`
ADR sobre escolha de Clean Architecture.

#### [NEW] `docs/adr/ADR-002-event-driven-decoupling.md`
ADR sobre EventEmitter2 para desacoplamento.

#### [NEW] `docs/adr/ADR-003-data-lifecycle-soft-delete-and-audit.md`
ADR sobre ciclo de vida de dados (soft delete no relacional + trilha complementar no MongoDB), incluindo ganhos e trade-offs.

#### [NEW] `scripts/benchmark.ps1` (já previsto na Fase 1)
Script que executa Autocannon em runner dedicado (container separado da app) contra:
1. `GET /api/v1/vehicles` (com cache quente)
2. `GET /api/v1/vehicles` (com cache frio / invalidado)

#### [NEW] `aivacol-postman-collection.json`
Coleção Postman exportada do Swagger JSON, na raiz do projeto.

#### [NEW] `.github/workflows/ci.yml`
GitHub Actions CI:
```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test -- --coverage
```

---

## Verification Plan

### Automated Tests

```powershell
# Dentro do container (via script)
.\scripts\test.ps1          # Testes unitários com coverage
.\scripts\test-e2e.ps1      # Testes e2e
.\scripts\lint.ps1           # Lint + lint:fix + typecheck
```

### Manual Verification

1. `docker compose up --build` — todos os 5 serviços sobem sem erro
2. Acessar `http://localhost:3000/api/docs` — Swagger UI carrega
3. Login via Swagger → obter JWT → testar CRUD de vehicles
4. Verificar logs no console Docker (correlation ID, método, rota, tempo, status)
5. Verificar MongoDB (logs de auditoria gravados)
6. Verificar RabbitMQ Management UI (`http://localhost:15672`) — mensagens chegando
7. `.\scripts\benchmark.ps1` — output mostra diferença de latência cache vs DB
8. Coverage report → ≥ 90%

---

## Regras Invioláveis para IAs Executoras

1. **Seguir `task.md`** marcando ticks a cada etapa concluída
2. **Atualizar `struct.md`** após cada ciclo com `git status`
3. **Atualizar `ACHIEVEMENTS.md`** ao final de cada fase
4. **NUNCA** executar `npm install` no host — sempre dentro do container Docker
5. **NUNCA** criar código bash no host — apenas PowerShell
6. **NUNCA** pular testes — cada fase inclui validação
7. **NUNCA** acoplar domínio a infraestrutura
8. **Manter lint:fix e typecheck** passando a cada commit

---

*Fim do Implementation Plan — pronto para execução a partir da Fase 0.*
