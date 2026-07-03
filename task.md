# task.md — Checklist de Implementação Aivacol Fleet Management API

> **Documento de tracking.** Marcar `[x]` ao concluir cada item. Marcar `[/]` quando em progresso.

---

## ⚠️ PROTOCOLO DE INÍCIO DE SESSÃO (OBRIGATÓRIO)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Execute NESTA ORDEM antes de qualquer outra ação:

  1. Leia  →  MASTER.md
  2. Leia  →  implementation_plan.md
  3. Leia  →  task.md               (este arquivo)
  4. Leia  →  struct.md
  5. Leia  →  ACHIEVEMENTS.md
  6. Execute →  git status
  7. Execute →  git log --oneline -5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Regras Obrigatórias para CADA Ciclo de Trabalho

- [x] Ao final de cada fase, executar `git status`
- [x] Atualizar `struct.md` com todos os arquivos criados/deletados
- [x] Atualizar `ACHIEVEMENTS.md` com o que foi implementado
- [x] Garantir que `lint`, `lint:fix` e `typecheck` passam (N/A nesta fase: scaffold NestJS inicia na Fase 2)
- [x] Commitar com mensagem semântica (feat/fix/test/chore/docs)
- [x] NUNCA executar `npm install` no host — apenas dentro do container Docker
- [x] NUNCA criar código bash no host — apenas PowerShell

---

## Definition of Done por Fase

- [x] Artefatos da fase criados/alterados conforme checklist
- [x] `struct.md` atualizado com arquivos criados/deletados
- [x] `ACHIEVEMENTS.md` atualizado com evidências e comandos executados
- [x] Validações da fase executadas com sucesso
- [x] `git status` revisado antes do commit
- [x] Commit semântico criado ao final da fase

---

## Estratégia de Branches e CI

- [x] **Fase 0 (planejamento)** pode ocorrer diretamente em `main` para acelerar alinhamento inicial
- [x] **A partir da Fase 1**, todo trabalho deve ocorrer em branch dedicada com PR para `main`
- [ ] CI obrigatório em todo PR: `lint`, `typecheck`, `test` (e `test:e2e` quando aplicável)
- [ ] Merge em `main` apenas com CI verde e checklist da fase preenchido

### Convenção de branches por fase

- [x] Fase 1 inicia branch `feat/phase-1-docker-infra`
- [x] Fase 2 inicia branch `feat/phase-2-nest-bootstrap`
- [x] Fase 3 inicia branch `feat/phase-3-cross-cutting`
- [x] Fase 4 inicia branch `feat/phase-4-domain`
- [x] Fase 5 inicia branch `feat/phase-5-infra-adapters`
- [ ] Fase 6 inicia branch `feat/phase-6-application-presentation`
- [ ] Fase 7 inicia branch `feat/phase-7-tests-quality`
- [ ] Fase 8 inicia branch `feat/phase-8-docs-release`

### Regra de início de branch

- [x] Criar branch no começo da fase (antes de criar/alterar arquivos da fase)
- [x] Subir branch com `git push -u origin <branch>` no primeiro push
- [ ] Abrir PR ao concluir a fase e só então fazer merge em `main`

---

## Fase 0 — Preparação do Repositório

- [x] Verificar se o diretório já é um repositório Git
- [x] Se `git status` retornar `fatal: not a git repository`, executar `git init` uma única vez
- [x] Criar commit inicial com os arquivos de planejamento existentes
- [x] Registrar em `ACHIEVEMENTS.md` que a preparação do repositório foi concluída

---

## Fase 1 — Scaffolding e Infraestrutura Docker

### Docker Compose

- [x] Criar `docker-compose.yml` com 5 serviços core + 1 serviço auxiliar (`benchmark-runner`):
  - [x] `app` — Node.js 18 Alpine, hot-reload com volumes, porta 3000
  - [x] `sqlserver` — `mcr.microsoft.com/mssql/server:2022-latest`, porta 1433, health check
  - [x] `redis` — `redis:7-alpine`, porta 6379, persistência com AOF
  - [x] `rabbitmq` — `rabbitmq:3-management-alpine`, portas 5672/15672, health check
  - [x] `mongodb` — `mongo:7`, porta 27017
- [x] Configurar rede interna `aivacol-network`
- [x] Explicitar port mappings no host para UX/debug do examinador:
  - [x] `3000:3000` (app)
  - [x] `1433:1433` (sqlserver)
  - [x] `6379:6379` (redis)
  - [x] `5672:5672` e `15672:15672` (rabbitmq)
  - [x] `27017:27017` (mongodb)
- [x] Configurar named volumes para persistência de dados
- [x] Configurar `depends_on` com conditions (health checks)
- [x] Implementar espera ativa no `app` para dependências (`sqlserver`, `redis`, `rabbitmq`, `mongodb`) antes do bootstrap
- [x] Garantir ordem determinística de subida: `migrate.ps1` -> `seed.ps1` -> `dev.ps1`

### Dockerfile

- [x] Criar `Dockerfile` multistage:
  - [x] Stage `dev` — Node.js 18 Alpine, instala deps, CMD com fallback para `npm run start:dev` quando disponível
  - [x] Stage `builder` — copia source, roda build quando disponível
  - [x] Stage `production` — imagem mínima, usuário não-root, apenas `dist/` e `node_modules` de produção
- [x] Adicionar `HEALTHCHECK` no stage production

### Configuração

- [x] Criar `.env` com todas as variáveis (conforme MASTER.md seção 5.4)
- [x] Criar `.env.example` (sem valores sensíveis)
- [x] Criar `.dockerignore` (node_modules, dist, .git, coverage, test)
- [x] Criar `.gitignore` (node_modules, dist, .env, coverage)

### Scripts PowerShell

- [x] `scripts/dev.ps1` — `docker compose up --build -d` + mensagens coloridas
- [x] `scripts/stop.ps1` — `docker compose down`
- [x] `scripts/logs.ps1` — `docker compose logs -f app`
- [x] `scripts/test.ps1` — executa `npm run test:cov` dentro do container
- [x] `scripts/test-e2e.ps1` — executa `npm run test:e2e` dentro do container
- [x] `scripts/lint.ps1` — executa `npm run lint` + `npm run lint:fix` + `npm run typecheck` dentro do container
- [x] `scripts/migrate.ps1` — executa migrations TypeORM dentro do container
- [x] `scripts/seed.ps1` — executa seed do banco dentro do container
- [x] `scripts/benchmark.ps1` — executa Autocannon em runner dedicado (container separado da app)
- [x] `scripts/benchmark.ts` — implementa cenários Autocannon; chamado pelo `scripts/benchmark.ps1`
- [x] `scripts/benchmark.ps1` deve usar `docker compose --profile tools run --rm benchmark-runner`
- [x] `scripts/benchmark.ts` deve apontar para `http://app:3000` por padrão (env `BENCHMARK_BASE_URL` opcional)

### Validação Fase 1

- [x] `docker compose up --build` sobe todos os 5 serviços sem erros
- [x] `docker compose ps` mostra todos healthy/running
- [x] Criar `docs/runbooks/infra-contingency.md` com plano de contingência operacional
- [x] Atualizar `struct.md`
- [x] Atualizar `ACHIEVEMENTS.md`
- [x] Commit: `chore: setup Docker infrastructure`

---

## Fase 2 — Projeto NestJS Base + Configuração

### Scaffolding

- [x] Inicializar projeto NestJS dentro do container (`docker compose run --rm app npx @nestjs/cli new . --package-manager npm --skip-git --skip-install --strict`)
- [x] Garantir modo nao interativo do scaffolding no container (headless-safe)
- [x] Instalar dependências core:
  - [x] `@nestjs/typeorm typeorm tedious` (SQL Server)
  - [x] `@nestjs/mongoose mongoose` (MongoDB)
  - [x] `@nestjs/event-emitter` (eventos internos)
  - [x] `@nestjs/swagger` (documentação)
  - [x] `@nestjs/passport passport passport-jwt @nestjs/jwt` (autenticação)
  - [x] `@golevelup/nestjs-rabbitmq` (mensageria)
  - [x] `ioredis` (Redis)
  - [x] `class-validator class-transformer` (validação)
  - [x] `bcrypt uuid` (utilidades)
  - [x] `@types/passport-jwt @types/bcrypt` (types dev)
  - [x] `autocannon` (benchmark dev)

### Configuração Principal

- [x] Configurar `src/main.ts`:
  - [x] `ValidationPipe` global (whitelist, transform, forbidNonWhitelisted)
  - [x] Swagger setup em `/api/docs` com Bearer Auth
  - [x] Prefixo global `/api/v1`
  - [x] CORS por allowlist via env `CORS_ORIGINS`
  - [x] `enableShutdownHooks()`
  - [x] Encerramento graceful no shutdown para conexões externas
  - [x] Logger do NestJS
- [x] Configurar `src/app.module.ts`:
  - [x] `ConfigModule.forRoot({ isGlobal: true })`
  - [x] `TypeOrmModule.forRootAsync()` com config factory
  - [x] `MongooseModule.forRootAsync()` com config factory
  - [x] `EventEmitterModule.forRoot()`
  - [x] Import de todos os feature modules (placeholder)

### Arquivos de Configuração

- [x] `src/config/database.config.ts` — TypeORM + SQL Server config factory
  - [x] Configurar pool explícito por env (`DB_POOL_MIN`, `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`)
- [x] `src/config/cache.config.ts` — Redis config factory (host, port, TTL)
- [x] `src/config/messaging.config.ts` — RabbitMQ config factory
- [x] `src/config/audit.config.ts` — MongoDB config factory
- [x] `src/config/auth.config.ts` — JWT config factory (secret, expiresIn)
- [x] `src/config/cors.config.ts` — parse/validação de `CORS_ORIGINS`
- [x] `src/config/throttle.config.ts` — parse/validação de `THROTTLE_TTL_SECONDS` e `THROTTLE_LIMIT`

### Tooling

- [x] Configurar ESLint (flat config ou `.eslintrc.js`) com `@typescript-eslint` + Prettier
- [x] Configurar `.prettierrc` (singleQuote, trailingComma, printWidth: 100)
- [x] Configurar `jest.config.ts` com threshold de 90% (unit)
- [x] Configurar `jest-e2e.config.ts` (e2e)
- [x] Configurar `tsconfig.json` com strict mode e paths aliases
- [x] Configurar `tsconfig.build.json`
- [x] Configurar `nest-cli.json` com Swagger CLI plugin
- [x] Fixar versões exatas de dependências diretas no `package.json` (sem `^` e sem `~`)
- [x] Garantir `package-lock.json` versionado e consistente com a árvore de dependências
- [x] Adicionar scripts no `package.json`:
  - [x] `lint`, `lint:fix`, `typecheck`
  - [x] `test`, `test:cov`, `test:watch`
  - [x] `test:e2e`
  - [x] `migration:generate`, `migration:run`, `migration:revert`
  - [x] `seed`
  - [x] `benchmark`

### Validação Fase 2

- [x] App sobe no container sem erros
- [x] `http://localhost:3000/api/docs` carrega Swagger UI (vazio)
- [x] Scaffold NestJS executa sem interação (headless-safe)
- [x] `npm run lint` passa sem erros
- [x] `npm run lint:fix` passa sem erros
- [x] `npm run typecheck` passa sem erros
- [x] Atualizar `struct.md`
- [x] Atualizar `ACHIEVEMENTS.md`
- [x] Commit: `feat: initialize NestJS project with base configuration`

---

## Fase 3 — Common (Cross-Cutting Concerns)

### ExceptionFilter Global

- [x] `src/common/filters/global-exception.filter.ts`
  - [x] Captura `DomainException` → mapeia para HTTP status adequado
  - [x] Captura `HttpException` → preserva status original
  - [x] Captura `Error` genérico → 500 com mensagem limpa
  - [x] Retorna formato padronizado: `{ statusCode, message, timestamp, path, correlationId }`
  - [x] Loga stack-trace no console (visível no Docker)

### Interceptors

- [x] `src/common/interceptors/logging.interceptor.ts`
  - [x] Registra: Método HTTP, Rota, User ID (se autenticado), Tempo (ms), Status Code
  - [x] Usa NestJS Logger
- [x] `src/common/interceptors/correlation-id.interceptor.ts`
  - [x] Gera UUID v4 se não vier no header `X-Correlation-ID`
  - [x] Injeta no response header
  - [x] Disponibiliza via request para uso em logs e respostas de erro

### Middleware

- [x] `src/common/middleware/correlation-id.middleware.ts`
  - [x] Alternativa ao interceptor para captura mais precoce (antes dos guards)

### Guards

- [x] `src/common/guards/jwt-auth.guard.ts`
  - [x] Extends `AuthGuard('jwt')`
  - [x] Respeita decorator `@Public()` para pular autenticação
- [x] `src/common/guards/throttler.guard.ts`
  - [x] Guard global de rate limiting para rotas HTTP
  - [x] Limites vindos de `THROTTLE_TTL_SECONDS` e `THROTTLE_LIMIT`

### Decorators

- [x] `src/common/decorators/current-user.decorator.ts` — extrai user do JWT request
- [x] `src/common/decorators/public.decorator.ts` — marca rota como pública

### Registrar Globalmente

- [x] Registrar `GlobalExceptionFilter` como provider global no `app.module.ts`
- [x] Registrar `LoggingInterceptor` como interceptor global
- [x] Registrar `CorrelationIdMiddleware` no `AppModule.configure()`
- [x] Registrar `JwtAuthGuard` como guard global
- [x] Registrar guard global de throttling

### Lifecycle

- [x] `src/infrastructure/lifecycle/graceful-shutdown.service.ts`
  - [x] Fechar conexão Redis no shutdown
  - [x] Fechar conexão RabbitMQ no shutdown
  - [x] Fechar conexão MongoDB no shutdown

### Health Check

- [x] `src/common/controllers/health.controller.ts`
  - [x] `GET /api/v1/health` — rota protegida por JWT, retorna status de cada serviço
  - [x] Verificar conexões: SQL Server, Redis, RabbitMQ, MongoDB

### Validação Fase 3

- [x] Todas as rotas requerem JWT (401 sem token)
- [x] Rota `/api/v1/health` exige autenticação e retorna 401 sem token
- [x] Erros retornam formato padronizado com correlationId
- [x] Excesso de requisições retorna `429` com `code: RATE_LIMIT_EXCEEDED`
- [x] Logs no console mostram método, rota, tempo, status
- [x] `npm run lint` + `npm run lint:fix` + `npm run typecheck` passam
- [x] Atualizar `struct.md`
- [x] Atualizar `ACHIEVEMENTS.md`
- [ ] Commit: `feat: add cross-cutting concerns (filters, interceptors, guards)`

---

## Fase 4 — Domain Layer (Entidades Puras, Portas, Exceções)

### Exceções de Domínio

- [x] `src/common/domain/exceptions/domain.exception.ts` — classe base abstrata com `code: string`
- [x] `src/common/domain/exceptions/entity-not-found.exception.ts` — `EntityNotFoundException`
- [x] `src/common/domain/exceptions/business-rule-violation.exception.ts` — `BusinessRuleViolationException`
- [x] `src/common/domain/exceptions/entity-validation.exception.ts` — `EntityValidationException`
- [x] `src/common/domain/exceptions/duplicate-entity.exception.ts` — `DuplicateEntityException`

### Interfaces/Portas do Domínio (compartilhadas)

- [x] `src/common/domain/interfaces/cache-service.interface.ts` — `ICacheService` + Symbol
- [x] `src/common/domain/interfaces/event-publisher.interface.ts` — `IEventPublisher` + Symbol
- [x] `src/common/domain/interfaces/audit-logger.interface.ts` — `IAuditLogger` + Symbol

### Entidades e Portas — Vehicle

- [x] `src/modules/vehicles/domain/entities/vehicle.entity.ts`
  - [x] Classe TypeScript pura (ZERO imports de framework)
  - [x] Props: id, licensePlate, chassis, renavam, year, modelId, createdAt, updatedAt, createdBy
  - [x] Método `validate()` com regras de negócio
- [x] `src/modules/vehicles/domain/interfaces/vehicle-repository.interface.ts`
  - [x] `IVehicleRepository`: findById, findAll, findByLicensePlate, create, update, delete
  - [x] Symbol `VEHICLE_REPOSITORY`

### Entidades e Portas — Model

- [x] `src/modules/models/domain/entities/model.entity.ts`
  - [x] Props: id, name, brandId, createdAt, updatedAt, createdBy
- [x] `src/modules/models/domain/interfaces/model-repository.interface.ts`
  - [x] `IModelRepository` + Symbol `MODEL_REPOSITORY`

### Entidades e Portas — Brand

- [x] `src/modules/brands/domain/entities/brand.entity.ts`
  - [x] Props: id, name, createdAt, updatedAt, createdBy
- [x] `src/modules/brands/domain/interfaces/brand-repository.interface.ts`
  - [x] `IBrandRepository` + Symbol `BRAND_REPOSITORY`

### Entidades e Portas — User

- [x] `src/modules/users/domain/entities/user.entity.ts`
  - [x] Props: id, nickname, name, email, passwordHash
- [x] `src/modules/users/domain/interfaces/user-repository.interface.ts`
  - [x] `IUserRepository` + Symbol `USER_REPOSITORY`

### Value Objects (obrigatório)

- [x] `src/common/domain/value-objects/license-plate.vo.ts` — validação de placa brasileira (Mercosul)
- [x] `src/common/domain/value-objects/chassis.vo.ts` — validação de chassi (17 caracteres)
- [x] `src/common/domain/value-objects/renavam.vo.ts` — validação de renavam

### Validação Fase 4

- [x] Nenhum import de `@nestjs/*`, `typeorm`, `mongoose` nos arquivos de domínio
- [x] Todas as entidades têm método `validate()`
- [x] Todas as interfaces definem contratos claros
- [x] Value Objects de placa, chassi e renavam aplicados no domínio (não apenas em DTO)
- [x] `npm run lint` + `npm run lint:fix` + `npm run typecheck` passam
- [x] Atualizar `struct.md`
- [x] Atualizar `ACHIEVEMENTS.md`
- [x] Commit: `feat: add domain layer (entities, ports, exceptions)`

---

## Fase 5 — Infrastructure Layer (Adapters)

### ORM Entities (TypeORM)

- [x] `src/modules/vehicles/infrastructure/persistence/entities/vehicle.orm-entity.ts`
  - [x] `@Entity('vehicles')` com todas as colunas e FKs
  - [x] `@ManyToOne(() => ModelOrmEntity)` com `@JoinColumn({ name: 'model_id' })`
  - [x] `@CreateDateColumn`, `@UpdateDateColumn`
- [x] `src/modules/models/infrastructure/persistence/entities/model.orm-entity.ts`
  - [x] `@Entity('models')` com FK `brand_id` para `brands`
  - [x] `@ManyToOne(() => BrandOrmEntity)`
- [x] `src/modules/brands/infrastructure/persistence/entities/brand.orm-entity.ts`
  - [x] `@Entity('brands')`
- [x] `src/modules/users/infrastructure/persistence/entities/user.orm-entity.ts`
  - [x] `@Entity('users')` com `nickname`, `name`, `email`, metadados (`created_at`, `updated_at`, `created_by`) e campo técnico `password_hash`
  - [x] Documentar no README que `password_hash` é extensão técnica para autenticação JWT e não faz parte do contrato público

### Mappers (Domain ↔ ORM)

- [x] `src/modules/vehicles/application/mappers/vehicle.mapper.ts` — toDomain / toOrm
- [x] `src/modules/models/application/mappers/model.mapper.ts` — toDomain / toOrm
- [x] `src/modules/brands/application/mappers/brand.mapper.ts` — toDomain / toOrm
- [x] `src/modules/users/application/mappers/user.mapper.ts` — toDomain / toOrm

### Repository Implementations

- [x] `src/modules/vehicles/infrastructure/persistence/repositories/typeorm-vehicle.repository.ts`
  - [x] Implementa `IVehicleRepository`
  - [x] Usa `Repository<VehicleOrmEntity>` do TypeORM
  - [x] Mapeia entre ORM Entity e Domain Entity via Mapper
- [x] `src/modules/models/infrastructure/persistence/repositories/typeorm-model.repository.ts`
  - [x] Implementa `IModelRepository`
- [x] `src/modules/brands/infrastructure/persistence/repositories/typeorm-brand.repository.ts`
  - [x] Implementa `IBrandRepository`
- [x] `src/modules/users/infrastructure/persistence/repositories/typeorm-user.repository.ts`
  - [x] Implementa `IUserRepository`

### Cache (Redis)

- [x] `src/infrastructure/cache/redis-cache.service.ts`
  - [x] Implementa `ICacheService`
  - [x] Usa `ioredis` diretamente
  - [x] Métodos: `get<T>`, `set<T>`, `del`, `delByPattern` (via SCAN + DEL)
  - [x] TTL configurável via `CACHE_TTL` env var
  - [x] Graceful: se Redis cair, loga erro e retorna null/void (não quebra app)
- [x] `src/infrastructure/cache/cache.module.ts`

### Mensageria (RabbitMQ)

- [x] `src/infrastructure/messaging/rabbitmq-event-publisher.ts`
  - [x] Implementa `IEventPublisher`
  - [x] Usa `@golevelup/nestjs-rabbitmq` (`AmqpConnection`)
  - [x] Registrar trade-off da escolha (`@golevelup/nestjs-rabbitmq` vs `@nestjs/microservices`) em ADR e README
  - [x] Publica em exchange `fleet-events` com routing key por tipo de evento
  - [x] Publisher confirms habilitado para confirmação de entrega
  - [x] Publicação com roteamento obrigatório e tratamento de unroutable messages
  - [x] Retry com backoff exponencial para falhas transitórias
  - [x] Estratégia de DLQ para mensagens que excederem tentativas
  - [x] Graceful: se RabbitMQ cair, loga erro (não quebra app)
- [x] `src/infrastructure/messaging/messaging.module.ts`
  - [x] `RabbitMQModule.forRootAsync()` com `connectionInitOptions: { wait: false }`

### Auditoria (MongoDB)

- [x] `src/infrastructure/audit/schemas/audit-log.schema.ts`
  - [x] Schema Mongoose: action, entity, entityId, userId, timestamp, changes, metadata
  - [x] Índices em userId, entity, createdAt
  - [x] TTL index opcional (ex: 90 dias)
- [x] `src/infrastructure/audit/mongo-audit-logger.ts`
  - [x] Implementa `IAuditLogger`
  - [x] Usa Mongoose Model para inserir logs
  - [x] Graceful: se MongoDB cair, loga erro (não quebra app)
- [x] `src/infrastructure/audit/audit.module.ts`

### Event Listeners (Desacoplamento)

- [x] `src/infrastructure/audit/listeners/service-audit.listener.ts`
  - [x] `@OnEvent('audit.service_interaction', { async: true })`
  - [x] Registra `AUTH`, `READ` e `MUTATION` (todas as interações de serviço)
  - [x] Chama `IAuditLogger.log()` dentro de try-catch
  - [x] **NUNCA relança exceção**
- [x] `src/modules/vehicles/infrastructure/listeners/vehicle-messaging.listener.ts`
  - [x] `@OnEvent('vehicle.created', { async: true })`
  - [x] `@OnEvent('vehicle.updated', { async: true })`
  - [x] Chama `IEventPublisher.publish()` dentro de try-catch
  - [x] Inclui `eventId` para idempotência de consumo
  - [x] **NUNCA relança exceção**

### Migrations

- [x] `src/infrastructure/database/migrations/TIMESTAMP-CreateUsersTable.ts`
- [x] `src/infrastructure/database/migrations/TIMESTAMP-CreateBrandsTable.ts`
- [x] `src/infrastructure/database/migrations/TIMESTAMP-CreateModelsTable.ts` (FK para brands)
- [x] `src/infrastructure/database/migrations/TIMESTAMP-CreateVehiclesTable.ts` (FK para models)
- [x] Adicionar `deleted_at` nas entidades com soft delete
- [x] Implementar unicidade para registros ativos (`deleted_at IS NULL`) em `license_plate`, `chassis` e `renavam`
- [x] Implementar índices filtrados com SQL raw via `queryRunner.query(...)` (não via decorator TypeORM)
- [x] Garantir `down` explícito removendo os índices filtrados

### Seed

- [x] `src/infrastructure/database/seeds/seed.ts`
  - [x] Cria usuário `aivacol` com senha hash
  - [x] Cria brands de exemplo (ex: Fiat, Volkswagen, Chevrolet, Toyota)
  - [x] Cria models de exemplo (ex: Gol, Onix, Argo, Corolla)
  - [x] Cria vehicles de exemplo
- [x] `seed_vehicles.json` na raiz do projeto (dados mock)

### Feature Modules (wiring DI)

- [x] `src/modules/vehicles/vehicles.module.ts` — registra providers com tokens de injeção
- [x] `src/modules/models/models.module.ts`
- [x] `src/modules/brands/brands.module.ts`
- [x] `src/modules/users/users.module.ts`

### Validação Fase 5

- [x] Migrations rodam sem erros no SQL Server
- [x] Seed popula o banco com dados de exemplo
- [x] Redis conecta e responde a PING
- [x] RabbitMQ conecta (ou falha gracefully)
- [x] MongoDB conecta (ou falha gracefully)
- [x] Cenário validado: criar veículo, soft delete, recriar com mesma placa/chassi/renavam sem violar unicidade de ativo
- [x] `npm run lint` + `npm run lint:fix` + `npm run typecheck` passam
- [x] Atualizar `struct.md`
- [x] Atualizar `ACHIEVEMENTS.md`
- [x] Commit: `feat: add infrastructure layer (TypeORM, Redis, RabbitMQ, MongoDB)`

---

## Fase 6 — Application + Presentation Layer

### Autenticação

- [x] `src/modules/auth/application/services/auth.service.ts`
  - [x] `login(nickname, password)` → valida credenciais, retorna `{ access_token }`
  - [x] Usa `bcrypt.compare()` para verificar senha
  - [x] Usa `JwtService.sign()` para gerar token
  - [x] Emite evento `audit.service_interaction` para tentativas de login
- [x] `src/modules/auth/application/dtos/login.dto.ts`
  - [x] `nickname: string`, `password: string` com validação
  - [x] Decorators Swagger (`@ApiProperty`, `@ApiBody`)
- [x] `src/modules/auth/infrastructure/strategies/jwt.strategy.ts`
  - [x] Passport JWT Strategy
  - [x] Extrai token do header Authorization (Bearer)
  - [x] Valida payload e retorna user
- [x] `src/modules/auth/presentation/controllers/auth.controller.ts`
  - [x] `POST /api/v1/auth/login` — `@Public()`, `@ApiBody`, `@ApiOperation`
  - [x] Retorna `{ access_token }` com `@ApiResponse(201)`
  - [x] Documenta erros com `@ApiResponse(400)` e `@ApiResponse(401)`
- [x] `src/modules/auth/auth.module.ts`

### Vehicle — Services (Use Cases)

- [x] `src/modules/vehicles/application/services/vehicle.service.ts`
  - [x] `create(dto, userId)`:
    - [x] Valida domínio
    - [x] Verifica duplicidade de placa
    - [x] Persiste no SQL Server
    - [x] Invalida cache Redis (`vehicles:*`)
    - [x] Emite evento `vehicle.created` via EventEmitter2
    - [x] Emite evento `audit.service_interaction`
  - [x] `findAll(query)`:
    - [x] Suporta paginacao (`page`, `limit`, `sort`, `order`) com limites defensivos
    - [x] Tenta buscar do cache (`vehicles:list:{page}:{limit}:{sort}:{order}`)
    - [x] Se miss, busca do DB, cacheia resultado
    - [x] Retorna lista
    - [x] Emite evento `audit.service_interaction`
  - [x] `findById(id)`:
    - [x] Tenta buscar do cache (`vehicles:{id}`)
    - [x] Se miss, busca do DB, cacheia resultado
    - [x] Lança `EntityNotFoundException` se não encontrar
    - [x] Emite evento `audit.service_interaction`
  - [x] `update(id, dto, userId)`:
    - [x] Busca veículo existente
    - [x] Atualiza campos
    - [x] Persiste
    - [x] Invalida cache
    - [x] Emite evento `vehicle.updated`
    - [x] Emite evento `audit.service_interaction`
  - [x] `delete(id, userId)`:
    - [x] Verifica existência
    - [x] Executa soft delete no DB relacional
    - [x] Invalida cache
    - [x] Não publica evento RabbitMQ (escopo obrigatório limitado a `vehicle.created` e `vehicle.updated`)
    - [x] Emite evento `audit.service_interaction`

### Vehicle — DTOs

- [x] `src/modules/vehicles/application/dtos/create-vehicle.dto.ts`
  - [x] Validação com `class-validator`
  - [x] Decorators Swagger (`@ApiProperty` com examples)
- [x] `src/modules/vehicles/application/dtos/update-vehicle.dto.ts`
  - [x] `PartialType(CreateVehicleDto)` do `@nestjs/swagger`
- [x] `src/modules/vehicles/application/dtos/vehicle-response.dto.ts`
  - [x] DTO de resposta para serialização

### Vehicle — Controller

- [x] `src/modules/vehicles/presentation/controllers/vehicle.controller.ts`
  - [x] `@ApiTags('vehicles')`, `@ApiBearerAuth()`, `@Controller('vehicles')`
  - [x] Todos os endpoints com `@ApiOperation` e `@ApiResponse(401)`
  - [x] `GET /api/v1/vehicles` — `@ApiResponse(200)` + query params de paginacao
  - [x] `GET /api/v1/vehicles/:id` — `@ApiParam('id')`, `@ApiResponse(200)`, `@ApiResponse(404)`
  - [x] `POST /api/v1/vehicles` — `@ApiBody`, `@ApiResponse(201)`, `@ApiResponse(400)`, `@ApiResponse(409)`
  - [x] `PATCH /api/v1/vehicles/:id` — `@ApiParam('id')`, `@ApiBody`, `@ApiResponse(200)`, `@ApiResponse(400)`, `@ApiResponse(404)`, `@ApiResponse(409)`
  - [x] `DELETE /api/v1/vehicles/:id` — `@ApiParam('id')`, `@ApiResponse(200)`, `@ApiResponse(404)` (soft delete)
  - [x] Endpoints documentam `@ApiResponse(429)` para throttling
  - [x] Usa `@CurrentUser()` para extrair userId do JWT

### Model — CRUD completo

- [x] `src/modules/models/application/services/model.service.ts` — CRUD com associação a brand
  - [x] Emite evento `audit.service_interaction` em create, findAll, findById, update e delete
- [x] `src/modules/models/application/dtos/create-model.dto.ts` — inclui `brandId`
- [x] `src/modules/models/application/dtos/update-model.dto.ts`
- [x] `src/modules/models/application/dtos/model-response.dto.ts`
- [x] `src/modules/models/presentation/controllers/model.controller.ts`
  - [x] `POST /api/v1/models`, `GET /api/v1/models`, `GET /api/v1/models/:id`, `PATCH /api/v1/models/:id`, `DELETE /api/v1/models/:id`
  - [x] Todos os endpoints com `@ApiOperation`, `@ApiBearerAuth()` e `@ApiResponse(401)`
  - [x] Rotas com `:id` documentadas com `@ApiParam('id')`
  - [x] Rotas `POST` e `PATCH` documentadas com `@ApiBody`
  - [x] Respostas documentadas: sucesso `200/201`, erros `400`, `404`, `409` e `429` quando aplicáveis

### Brand — CRUD completo

- [x] `src/modules/brands/application/services/brand.service.ts`
  - [x] Emite evento `audit.service_interaction` em create, findAll, findById, update e delete
- [x] `src/modules/brands/application/dtos/create-brand.dto.ts`
- [x] `src/modules/brands/application/dtos/update-brand.dto.ts`
- [x] `src/modules/brands/application/dtos/brand-response.dto.ts`
- [x] `src/modules/brands/presentation/controllers/brand.controller.ts`
  - [x] `POST /api/v1/brands`, `GET /api/v1/brands`, `GET /api/v1/brands/:id`, `PATCH /api/v1/brands/:id`, `DELETE /api/v1/brands/:id`
  - [x] Todos os endpoints com `@ApiOperation`, `@ApiBearerAuth()` e `@ApiResponse(401)`
  - [x] Rotas com `:id` documentadas com `@ApiParam('id')`
  - [x] Rotas `POST` e `PATCH` documentadas com `@ApiBody`
  - [x] Respostas documentadas: sucesso `200/201`, erros `400`, `404`, `409` e `429` quando aplicáveis

### Catálogo de Erros

- [x] `src/common/errors/error-catalog.ts`
  - [x] Definir códigos estáveis (ex.: `VEHICLE_NOT_FOUND`, `DUPLICATE_LICENSE_PLATE`, `INVALID_CREDENTIALS`, `RATE_LIMIT_EXCEEDED`)
  - [x] Mapear `code` -> `httpStatus` -> `messagePtBr`
  - [x] Integrar `GlobalExceptionFilter` para serializar `code` sempre que aplicável

### Users — Consulta

- [x] `src/modules/users/application/services/user.service.ts` — findAll, findById
  - [x] Emite evento `audit.service_interaction` em findAll e findById
- [x] `src/modules/users/application/dtos/user-response.dto.ts`
- [x] `src/modules/users/presentation/controllers/user.controller.ts`
  - [x] `GET /api/v1/users`, `GET /api/v1/users/:id`
  - [x] Todos os endpoints com `@ApiOperation`, `@ApiBearerAuth()` e `@ApiResponse(401)`
  - [x] `GET /api/v1/users` documentado com `@ApiResponse(200)`
  - [x] `GET /api/v1/users/:id` documentado com `@ApiParam('id')`, `@ApiResponse(200)` e `@ApiResponse(404)`

### Validação Fase 6

- [x] Login funciona: `POST /api/v1/auth/login` retorna JWT
- [x] CRUD completo de vehicles funciona via Swagger
- [x] Listagens usam paginacao e limites defensivos
- [x] CRUD completo de models funciona via Swagger
- [x] CRUD completo de brands funciona via Swagger
- [x] Consulta de users funciona via Swagger
- [x] Cache Redis funciona (segunda chamada é mais rápida)
- [x] Eventos de auditoria são emitidos por Auth, Vehicles, Models, Brands e Users
- [x] Auditoria de todas as interações de serviço é gravada no MongoDB
- [x] Mensagens chegam no RabbitMQ
- [x] Contrato Swagger de rotas protegidas usa `@ApiBearerAuth()`
- [x] Swagger documenta `409` em conflitos de unicidade
- [x] Swagger documenta `429` em rotas sujeitas a throttling
- [x] `403` documentado em endpoints com regra de autorização (quando aplicável)
- [x] Rotas sem token retornam 401
- [x] Erros retornam formato padronizado
- [x] `npm run lint` + `npm run lint:fix` + `npm run typecheck` passam
- [ ] Atualizar `struct.md`
- [ ] Atualizar `ACHIEVEMENTS.md`
- [ ] Commit: `feat: add application and presentation layers (CRUD, Auth, Swagger)`

---

## Nota de alinhamento de fases

- Fase 7 e a fase oficial de testes e qualidade (`test`, `test:e2e`, `test:cov`, coverage >= 90%)
- Fase 8 e focada em documentacao, benchmark, colecao Postman, CI e finalizacao

---

## Fase 7 — Testes (≥ 90% Coverage)

### Testes Unitários — Domain

- [ ] `vehicle.entity.spec.ts` — validação de placa, chassi, renavam, ano
- [ ] `model.entity.spec.ts` — validação de nome
- [ ] `brand.entity.spec.ts` — validação de nome
- [ ] Value Objects specs (license-plate, chassis, renavam)

### Testes Unitários — Application (Services/Use Cases)

- [ ] `vehicle.service.spec.ts`
  - [ ] Testar `create` — sucesso, placa duplicada, model inexistente
  - [ ] Testar `findAll` — cache hit, cache miss
  - [ ] Testar `findById` — sucesso, não encontrado
  - [ ] Testar `update` — sucesso, não encontrado
  - [ ] Testar `delete` — sucesso, não encontrado
  - [ ] Verificar que eventos são emitidos
  - [ ] Verificar que cache é invalidado
- [ ] `model.service.spec.ts` — CRUD completo mockado
- [ ] `brand.service.spec.ts` — CRUD completo mockado
- [ ] `auth.service.spec.ts` — login válido, inválido, token gerado

### Testes Unitários — Infrastructure

- [ ] `redis-cache.service.spec.ts` — mock ioredis, get/set/del/delByPattern
- [ ] `mongo-audit-logger.spec.ts` — mock mongoose model, log entry
- [ ] `rabbitmq-event-publisher.spec.ts` — mock AmqpConnection, publish
  - [ ] Cobre publisher confirm, retry/backoff e fallback para DLQ
- [ ] `service-audit.listener.spec.ts` — verifica que exceções são engolidas e não interrompem o fluxo principal
- [ ] `vehicle-messaging.listener.spec.ts` — verifica que exceções são engolidas
- [ ] `typeorm-vehicle.repository.spec.ts` — mock Repository, findById/create/update/delete

### Testes Unitários — Common

- [ ] `global-exception.filter.spec.ts` — DomainException→404, HttpException→status, Error→500
- [ ] `logging.interceptor.spec.ts` — verifica log output
- [ ] `jwt-auth.guard.spec.ts` — verifica @Public() bypass
- [ ] `throttler.guard.spec.ts` — limite excedido retorna 429

### Testes E2E

- [ ] `auth.e2e-spec.ts`
  - [ ] Login com credenciais válidas → 201 + token
  - [ ] Login com credenciais inválidas → 401
  - [ ] Acesso a rota protegida sem token → 401
  - [ ] Acesso a rota protegida com token válido → 200
- [ ] `vehicles.e2e-spec.ts`
  - [ ] CRUD completo via HTTP (create → read → update → delete)
  - [ ] Validação de campos obrigatórios → 400
  - [ ] Buscar veículo inexistente → 404
  - [ ] Criar veículo, soft delete e recriar com mesma placa/chassi/renavam
- [ ] `models.e2e-spec.ts` — CRUD completo via HTTP
- [ ] `brands.e2e-spec.ts` — CRUD completo via HTTP
- [ ] `health.e2e-spec.ts` — `GET /api/v1/health` → 200
  - [ ] Sem token → 401
  - [ ] Com token válido → 200
- [ ] `rate-limit.e2e-spec.ts`
  - [ ] Exceder limite no intervalo -> `429` + `RATE_LIMIT_EXCEEDED`

### Coverage

- [ ] Executar `npm run test:cov`
- [ ] Verificar que coverage global ≥ 90%:
  - [ ] Branches ≥ 80%
  - [ ] Functions ≥ 90%
  - [ ] Lines ≥ 90%
  - [ ] Statements ≥ 90%

### Validação Fase 7

- [ ] Todos os testes unitários passam
- [ ] Todos os testes e2e passam
- [ ] Coverage ≥ 90%
- [ ] `npm run lint` + `npm run lint:fix` + `npm run typecheck` passam
- [ ] Atualizar `struct.md`
- [ ] Atualizar `ACHIEVEMENTS.md`
- [ ] Commit: `test: add unit and e2e tests (coverage >= 90%)`

---

## Fase 8 — Documentação, Benchmark e Finalização

### README.md

- [ ] Visão geral do projeto
- [ ] Diagrama de arquitetura (texto/ASCII ou Mermaid)
- [ ] Tecnologias utilizadas
- [ ] Pré-requisitos (Docker Desktop, Git, PowerShell)
- [ ] Como rodar o projeto (`docker compose up`)
- [ ] Como rodar testes
- [ ] Como rodar benchmark
- [ ] Endpoints disponíveis (tabela)
- [ ] Variáveis de ambiente (tabela)
- [ ] Catálogo de erros (tabela `code` x `status` x `message`)
- [ ] Seção `✅ Checklist do Desafio` (tabela com todos os requisitos)
- [ ] Seção `🚀 Diferenciais de Engenharia` (decisões, trade-offs, evolução)

### ADRs

- [ ] `docs/adr/ADR-001-clean-architecture.md`
  - [ ] Contexto, decisão, consequências, alternativas consideradas
- [ ] `docs/adr/ADR-002-event-driven-decoupling.md`
  - [ ] Por que EventEmitter2, por que não acoplamento direto
- [ ] `docs/adr/ADR-003-data-lifecycle-soft-delete-and-audit.md`
  - [ ] Soft delete no SQL Server + trilha complementar no MongoDB (compliance e trade-offs)
- [ ] `docs/adr/ADR-004-sqlserver-filtered-unique-indexes-with-typeorm.md`
  - [ ] Limitação prática de decorators TypeORM para índice filtrado no SQL Server
  - [ ] Decisão de implementar índices filtrados com `queryRunner.query(...)` e `down` explícito

### Benchmark

- [ ] `scripts/benchmark.ts` (script Autocannon em runner dedicado)
  - [ ] Teste 1: `GET /api/v1/vehicles` com cache quente (Redis populado)
  - [ ] Teste 2: `GET /api/v1/vehicles` com cache frio (Redis limpo)
  - [ ] Output: comparação de latência e throughput
- [ ] Documentar comando de benchmark no README
- [ ] Garantir `scripts/benchmark.ps1` como ponto de entrada oficial chamando `scripts/benchmark.ts`
- [ ] Garantir benchmark em `benchmark-runner` na mesma rede Docker da API (target `http://app:3000`)

### Runbook Operacional

- [ ] `docs/runbooks/infra-contingency.md`
  - [ ] Conflito de portas no Docker Compose
  - [ ] Falha de pull/build de imagem
  - [ ] Scaffold headless fallback
  - [ ] Rollback de migration parcial
  - [ ] Mitigação para falta de memória/disco no Windows

### Postman Collection

- [ ] `aivacol-postman-collection.json` na raiz do projeto
  - [ ] Gerar a partir do Swagger e ajustar manualmente os fluxos de autenticação
  - [ ] Incluir variáveis de ambiente (base_url, token)
  - [ ] Incluir variáveis adicionais (`nickname`, `password`) para fluxo de login
  - [ ] Adicionar pre-request script em nível de collection para obter/renovar token automaticamente
  - [ ] Incluir exemplos de request/response para cada endpoint

### GitHub Actions CI

- [ ] `.github/workflows/ci.yml`
  - [ ] Trigger: push/PR na branch `main`
  - [ ] Steps: checkout → setup node → npm ci → lint → typecheck → test

### Segurança de API (mínimo de produção)

- [ ] Habilitar rate limiting global com limites por env
- [ ] Documentar no README política de throttling e resposta `429`

### seed_vehicles.json

- [ ] Arquivo na raiz com dados mock de veículos realistas
  - [ ] Placas no formato Mercosul
  - [ ] Marcas e modelos brasileiros
  - [ ] Anos variados

### Validação Final

- [ ] README está completo e claro
- [ ] Checklist do desafio está preenchido
- [ ] Diferenciais de engenharia explicados
- [ ] ADRs escritos e salvos em `/docs/adr/`
- [ ] Benchmark roda e mostra diferença de performance
- [ ] Postman collection funciona
- [ ] CI pipeline funciona (push no GitHub)
- [ ] Todos os testes passam
- [ ] Coverage ≥ 90%
- [ ] Docker Compose sobe limpo
- [ ] Swagger UI carrega com todos os endpoints documentados
- [ ] `npm run lint` + `npm run lint:fix` + `npm run typecheck` passam
- [ ] Atualizar `struct.md`
- [ ] Atualizar `ACHIEVEMENTS.md`
- [ ] Commit: `docs: add README, ADRs, benchmark, Postman collection, CI`

---

## Pós-Entrega

- [ ] Criar repositório no GitHub
- [ ] Push de toda a base
- [ ] Verificar que CI roda no GitHub Actions
- [ ] Review final do README
- [ ] Tag `v1.0.0`

---

_Fim do task.md — Este documento deve ser atualizado a cada etapa concluída._
