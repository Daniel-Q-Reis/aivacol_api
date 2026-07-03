# ACHIEVEMENTS.md — Registro de Implementação

> **Atualizado ao final de cada fase/bloco de implementação.**
> **Ordenação para leitura humana:** manter em ordem cronológica crescente (mais antigo -> mais novo).

---

## Bloco Inicial — Planejamento (2026-07-02)

### ✅ Concluído

- Leitura e análise do `objetivos.md`
- Criação do `MASTER.md` (documento-mestre do projeto)
- Criação do `implementation_plan.md` (plano detalhado em Fase 0 + 8 fases)
- Criação do `task.md` (checklist granular com ~200 itens)
- Criação do `struct.md` (mapa de arquivos)
- Criação do `ACHIEVEMENTS.md` (este arquivo)
- Auto-revisão de consistência aplicada nos pontos de auditoria global, Users, Swagger, lint, Git Fase 0 e decisões fechadas
- Refinamento de planejamento aplicado: matriz de rastreabilidade, placeholders de segurança, padronização PowerShell/paths e Definition of Done por fase
- Fase 0 — Preparação do Repositório concluída: Git inicializado e commit inicial criado
- Polimento final de planejamento aplicado: README com checklist/diferenciais, API versionada (`/api/v1`), paginacao prevista, benchmark em runner dedicado e reforco de `.gitignore`
- ADRs criados desde o planejamento em `docs/adr/` com contexto, decisao, beneficios e drawbacks
- Decisao de ciclo de vida de dados revisada para soft delete no SQL Server com trilha complementar no MongoDB (compliance e rastreabilidade)
- Correcoes de plano production-first aplicadas: mensageria com confirm/retry/DLQ/idempotencia, VOs obrigatorios, contingencia operacional e ajuste de auditoria por nivel

### 📝 Decisões Tomadas

- Clean Architecture com Ports & Adapters
- ioredis direto (não cache-manager) para controle fino
- @golevelup/nestjs-rabbitmq para mensageria
- EventEmitter2 para desacoplamento interno
- Autocannon para benchmark
- Todo desenvolvimento via Docker Compose
- Users ficam restritos a seed, autenticação, relacionamento via `created_by` e consultas protegidas
- Auditoria MongoDB registra todas as interações de serviço; RabbitMQ permanece restrito a eventos de veículos
- Exemplos de variáveis sensíveis usam placeholders `<CHANGE_ME_...>`
- Testes padronizados em `test/unit` e `test/e2e`, com specs colocalizados permitidos quando fizer sentido
- API versionada em `/api/v1` desde a fase de base
- Listagens planejadas com paginação (`page`, `limit`, `sort`, `order`) e limites defensivos

### 🔜 Próximos Passos

- Iniciar Fase 1 — Scaffolding e Infraestrutura Docker

---

## Fase 1 — Scaffolding e Infraestrutura Docker (2026-07-02)

### ✅ O que foi implementado

- `docker-compose.yml` com os servicos `app`, `sqlserver`, `redis`, `rabbitmq`, `mongodb` e `benchmark-runner` (profile `tools`)
- Rede dedicada `aivacol-network`, volumes nomeados e port mappings exigidos (`3000`, `1433`, `6379`, `5672`, `15672`, `27017`)
- Health checks configurados para `app`, `sqlserver`, `redis`, `rabbitmq` e `mongodb`
- `depends_on` com `condition: service_healthy` para dependencias do `app`
- Espera ativa de dependencias antes do bootstrap via `scripts/wait-for-deps.js` + `scripts/dev-container-start.js`
- `Dockerfile` multistage (`dev`, `builder`, `production`) com `HEALTHCHECK` e usuario nao-root no stage `production`
- Arquivos de ambiente e build: `.env`, `.env.example`, `.dockerignore` e ajuste de `.gitignore`
- Scripts PowerShell da fase em `scripts/`: `dev.ps1`, `stop.ps1`, `logs.ps1`, `test.ps1`, `test-e2e.ps1`, `lint.ps1`, `migrate.ps1`, `seed.ps1`, `benchmark.ps1`
- `scripts/benchmark.ts` com base padrao `http://app:3000` (sobrescrevivel por `BENCHMARK_BASE_URL`)
- Runbook operacional atualizado em `docs/runbooks/infra-contingency.md` cobrindo os cenarios mandatarios

### 🧪 Comandos executados

- `docker compose config`
- `docker compose up --build -d`
- `docker compose ps`
- `docker compose logs app --tail 60`

### 📌 Evidencias de validacao

- `docker compose config` validou o compose sem erro de sintaxe/estrutura
- `docker compose up --build -d` concluiu com criacao de rede/volumes e inicializacao de todos os servicos
- `docker compose ps` retornou `Up (...) (healthy)` para `app`, `sqlserver`, `redis`, `rabbitmq` e `mongodb`
- Logs do `app` confirmaram espera ativa:
  - `sqlserver ready`, `redis ready`, `rabbitmq ready`, `mongodb ready`
  - `all dependencies are reachable`
  - bootstrap iniciado apos dependencias saudaveis

### ⚠️ Problemas encontrados e correcoes

- **Permissao no Docker socket em sandbox** (`open //./pipe/dockerDesktopLinuxEngine: Access is denied`)
  - Correcao: comandos Docker executados com permissao elevada.
- **Permissao no `.git` para criar branch**
  - Correcao: criacao da branch `feat/phase-1-docker-infra` com permissao elevada.

### N/A nesta fase (com justificativa tecnica)

- `lint`, `lint:fix`, `typecheck`, `test`, `test:e2e`, `test:cov`: **N/A nesta fase**, pois o scaffold NestJS e `package.json` completo sao entregues na Fase 2.  
  Para manter governanca, os scripts `.ps1` ja foram criados e retornam N/A de forma explicita quando os scripts npm ainda nao existem.

### 🔜 Proximos passos (Fase 2)

- Inicializar o projeto NestJS dentro do container (modo headless-safe)
- Fixar dependencias e configurar `main.ts`, `app.module.ts`, configs de infra e tooling
- Ativar gates de qualidade (`lint`, `lint:fix`, `typecheck`) com execucao obrigatoria dentro do container

---

## Fase 2 — Projeto NestJS Base + Configuracao (2026-07-03)

### ✅ O que foi implementado

- Scaffold do NestJS executado dentro de container em modo headless-safe (sem interacao)
- Base do projeto criada com `src/`, `test/`, `package.json`, `tsconfig*`, `nest-cli.json`, ESLint e Prettier
- `src/main.ts` configurado com `ValidationPipe` global, Swagger em `/api/docs` com Bearer, prefixo global `/api/v1`, CORS por allowlist de env, `enableShutdownHooks`, logger Nest e fechamento graceful
- `src/app.module.ts` configurado com `ConfigModule` global, `TypeOrmModule.forRootAsync`, `MongooseModule.forRootAsync`, `EventEmitterModule.forRoot` e placeholders de modulos de feature
- Factories de configuracao criadas em `src/config/`: `database`, `cache`, `messaging`, `audit`, `auth`, `cors` e `throttle`
- Tooling de qualidade configurado: `.eslintrc.js`, `.prettierrc`, `jest.config.ts`, `jest-e2e.config.ts`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json` com plugin Swagger
- Scripts obrigatorios adicionados no `package.json`: lint/lint:fix/typecheck, test/test:cov/test:watch/test:e2e, migrations, seed e benchmark
- Dependencias diretas fixadas com versoes exatas (sem `^` e sem `~`) e lockfile versionado (`package-lock.json`)

### 🧪 Comandos executados

- `git checkout main && git pull origin main && git checkout -b feat/phase-2-nest-bootstrap` (branch ja existia; foi feito `git checkout feat/phase-2-nest-bootstrap`)
- `docker compose run --rm app npx @nestjs/cli@10.4.7 new . --package-manager npm --skip-git --skip-install --strict` (falhou por conflito com README existente)
- `docker compose run --rm app sh -lc "yes '' | npx @nestjs/cli@10.4.7 new /usr/src/app/tmp/nest-bootstrap --package-manager npm --skip-git --skip-install --strict"`
- `docker compose run --rm app sh -lc "cp ..."` (copia controlada dos artefatos scaffold para raiz do projeto)
- `docker compose run --rm app npm install`
- `docker compose run --rm app npm run lint`
- `docker compose run --rm app npm run lint:fix`
- `docker compose run --rm app npm run typecheck`
- `docker compose up --build -d`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/docs`

### 📌 Evidencias de validacao

- App sobe no container com bootstrap Nest completo e mapeamento de rota `GET /api/v1/health`
- Swagger carregado com sucesso em `http://localhost:3000/api/docs` (HTTP `200`)
- Scaffolding executado em modo headless-safe dentro do container
- Gate `npm run lint`: OK
- Gate `npm run lint:fix`: OK
- Gate `npm run typecheck`: OK

### ⚠️ Problemas encontrados e correcoes

- **Conflito no scaffold em raiz** (`README.md` existente): resolvido com scaffold em caminho temporario no volume e copia seletiva dos arquivos base
- **Falha inicial TypeORM por dependencia ausente `mssql`**: adicionada dependencia direta fixa `mssql`
- **Incompatibilidade de peer entre `typeorm` e `mssql@11`**: ajustado para `mssql@10.0.4` (compativel com TypeORM 0.3.20)
- **Falha inicial de login SQL Server no primeiro boot**: normalizada apos rebootstrap e restart da app com conexoes estabilizadas

### 🔜 Proximos passos (Fase 3)

- Implementar cross-cutting concerns (`ExceptionFilter`, interceptors, middleware, guards e decorators)
- Registrar providers globais no `AppModule` e adicionar `graceful-shutdown.service`
- Entregar health check expandido de dependencias conforme checklist da Fase 3

---

## Fase 3 — Common (Cross-Cutting Concerns) (2026-07-03)

### ✅ O que foi implementado

- `GlobalExceptionFilter` em `src/common/filters/global-exception.filter.ts` cobrindo `DomainException`, `HttpException` e erro generico com contrato padronizado (`statusCode`, `message`, `timestamp`, `path`, `correlationId`, `code` quando aplicavel)
- `ThrottlerExceptionFilter` em `src/common/filters/throttler-exception.filter.ts` para resposta `429` com `code: RATE_LIMIT_EXCEEDED`
- `CorrelationIdMiddleware` + `CorrelationIdInterceptor` para captura precoce e propagacao de `X-Correlation-ID` em request/response
- `LoggingInterceptor` global com log estruturado de `method`, `route`, `statusCode`, `durationMs`, `userId` e `correlationId`
- `JwtAuthGuard` global com suporte a bypass por `@Public()` e `ThrottlerGuard` global com limites por env (`THROTTLE_TTL_SECONDS`, `THROTTLE_LIMIT`)
- Decorators `@Public()` e `@CurrentUser()` implementados em `src/common/decorators/`
- `HealthController` protegido em `GET /api/v1/health`, verificando SQL Server, Redis, RabbitMQ e MongoDB
- `GracefulShutdownService` em `src/infrastructure/lifecycle/graceful-shutdown.service.ts` para fechamento seguro de SQL/Mongo e tentativa best-effort de Redis/RabbitMQ sem quebrar bootstrap
- Wiring global concluido em `src/app.module.ts` (filters, interceptors, guards e middleware via `configure()`)
- Pre-requisito tecnico minimo de JWT strategy entregue em `src/modules/auth/infrastructure/strategies/jwt.strategy.ts` + wiring no `AuthModule`

### 🧪 Comandos executados

- Protocolo inicial: leitura de `MASTER.md`, `implementation_plan.md`, `task.md`, `struct.md`, `ACHIEVEMENTS.md`, ADRs e runbook
- `git status`
- `git log --oneline -5`
- `git checkout main && git pull origin main && git checkout -b feat/phase-3-cross-cutting`
- `docker compose run --rm app npm install @nestjs/throttler@5.2.0`
- `docker compose run --rm app npm run lint:fix`
- `docker compose run --rm app npm run lint`
- `docker compose run --rm app npm run typecheck`
- `docker compose up --build -d`
- `docker compose ps`
- `docker compose logs app --tail 120`
- Validacoes HTTP (container-to-container):
  - sem token: `GET /api/v1/health`
  - com token valido: `GET /api/v1/health`
  - burst de 130 requests para validar throttling 429

### 📌 Evidencias de validacao

- Gate `npm run lint`: **OK**
- Gate `npm run lint:fix`: **OK**
- Gate `npm run typecheck`: **OK**
- `GET /api/v1/health` sem token: **401** com payload padronizado e `correlationId`
  - evidenciado: `{ "statusCode":401, "code":"UNAUTHORIZED", ... "correlationId":"cid-test-unauthorized" }`
- Rotas protegidas exigindo JWT: **401** sem token tambem em `GET /api/v1/status`
- `GET /api/v1/health` com token valido: **200** com conectores `sqlServer`, `redis`, `rabbitMq`, `mongoDb`
- Throttling global ativo: burst de 130 requisicoes retornou `COUNT_429:30` e primeira resposta 429 com `code: RATE_LIMIT_EXCEEDED`
- Logs de observabilidade confirmados no container:
  - `LoggingInterceptor` registrando `{"method":"GET","route":"/api/v1/health","statusCode":200,"durationMs":2,"userId":"staff-user","correlationId":"cid-log-200"}`

### ⚠️ Problemas encontrados e correcoes

- **Prettier/Lint com CRLF historico** em arquivos existentes (config/main/modules): resolvido executando `npm run lint:fix` no container antes do gate final
- **Typecheck no filtro global** por tipagem de `HttpException.getResponse()`: resolvido com normalizacao defensiva para `string | object`
- **Ordem de filtros globais** inicialmente fazia 429 cair no filtro global: corrigido invertendo ordem para priorizar `GlobalExceptionFilter` e depois `ThrottlerExceptionFilter`
- **Janela de restart da app** durante validacao de carga retornou `ECONNREFUSED`: validacao repetida apos app `started` com evidencias consistentes

### 🔜 Proximos passos (Fase 4)

- Iniciar apenas a Fase 4 (Domain Layer): excecoes de dominio adicionais, portas compartilhadas e entidades puras sem acoplamento a framework
- Introduzir Value Objects obrigatorios (`license-plate`, `chassis`, `renavam`) com validacoes de dominio
- Garantir rastreabilidade de contratos de erro e alinhamento com catalogo ao evoluir casos de uso

---

_Adicionar novas seções ao final deste arquivo para manter ordem cronológica crescente._

---

## Fase 4 — Domain Layer (Entidades, Portas, Exceções, Value Objects) (2026-07-03)

### ✅ O que foi implementado

- Excecoes de dominio finalizadas em `src/common/domain/exceptions/` com hierarquia pura TypeScript: `DomainException` (abstrata), `EntityNotFoundException`, `BusinessRuleViolationException`, `EntityValidationException` e `DuplicateEntityException`
- Portas compartilhadas de dominio criadas em `src/common/domain/interfaces/` com tokens `Symbol`: `ICacheService`, `IEventPublisher`, `IAuditLogger`
- Value Objects obrigatorios criados e aplicados no dominio: `LicensePlate`, `Chassis`, `Renavam` em `src/common/domain/value-objects/`
- Entidades puras com invariantes e `validate()` implementadas em `src/modules/*/domain/entities/`: `Vehicle`, `Model`, `Brand`, `User`
- Portas de repositorio por modulo implementadas em `src/modules/*/domain/interfaces/` com tokens `Symbol`: `IVehicleRepository`, `IModelRepository`, `IBrandRepository`, `IUserRepository`
- Aplicacao explicita dos VOs no dominio de veiculos: `Vehicle` recebe `licensePlate: LicensePlate`, `chassis: Chassis`, `renavam: Renavam` (nao via DTO)
- Comentarios tecnicos de alto valor adicionados nos pontos nao obvios: normalizacao/legado do Renavam, restricoes de charset de chassi e regra de ano do veiculo

### 🧪 Comandos executados

- Protocolo inicial: leitura de `MASTER.md`, `implementation_plan.md`, `task.md`, `struct.md`, `ACHIEVEMENTS.md`, ADRs e runbook
- `git status`
- `git log --oneline -5`
- `git checkout main && git pull origin main && git checkout -b feat/phase-4-domain`
- `docker compose run --rm app npm run lint`
- `docker compose run --rm app npm run lint:fix`
- `docker compose run --rm app npm run typecheck`
- `docker compose run --rm app npm run lint` (revalidacao apos `lint:fix`)
- `docker compose run --rm app npm run test`
- `docker compose run --rm app npm run test:cov`
- Buscas de pureza de dominio com `grep` para imports proibidos em `src/common/domain/**` e `src/modules/**/domain/**`

### 📌 Evidencias dos gates

- Gate `npm run lint`: **OK**
- Gate `npm run lint:fix`: **OK**
- Gate `npm run typecheck`: **OK**

### ✅ QA adicional executado apos review

- `npm run test`: **OK** (2 suites, 2 testes)
- `npm run test:cov`: **FALHOU no gate global de cobertura**, apesar dos testes verdes
  - Statements: `2.02%` (threshold `90%`)
  - Branches: `0%` (threshold `80%`)
  - Lines: `1.49%` (threshold `90%`)
  - Functions: `2.29%` (threshold `90%`)
- Causa principal: projeto ainda em fase inicial de implementacao (Fase 4 concluida, Fases 5-7 ainda nao entregues), com poucas specs cobrindo apenas scaffold/base.
- Acao recomendada para fechamento de QA forte: executar Fase 7 (suite unit + e2e completa) antes de considerar cobertura conforme meta global.

### 🔎 Evidencias de pureza de dominio

- `src/common/domain/**`: sem imports de `@nestjs/*`, `typeorm`, `mongoose`, `ioredis`, `amqplib`
- `src/modules/**/domain/**`: sem imports de `@nestjs/*`, `typeorm`, `mongoose`, `ioredis`, `amqplib`
- Validacao objetiva executada via busca regex no codigo com retorno `No files found` para todos os padroes proibidos dentro dos paths de dominio

### ⚠️ Problemas encontrados e correcoes

- **Lint inicial falhando por terminacao de linha (CRLF historico em arquivos existentes)**: resolvido com `npm run lint:fix` no container e reexecucao de `npm run lint` para fechar gate de qualidade
- **Tick pendente no task.md (commit da Fase 4)**: corrigido, item marcado com `[x]`
- **Densidade de comentarios tecnicos abaixo do esperado para manutencao humana**: reforco aplicado com comentarios adicionais em VOs, entidades e contrato de porta de eventos (seguindo secao 5.7)

### 🔜 Proximos passos (Fase 5)

- Implementar adapters de infraestrutura (TypeORM/Redis/RabbitMQ/MongoDB) consumindo as portas de dominio criadas nesta fase
- Entregar ORM entities, repositories concretos, listeners resilientes e migrations com indices unicos filtrados no SQL Server

### 🧾 Nota sobre variaveis de ambiente

- Politica de env (referencia de governanca): **N/A nesta fase**
- Justificativa: a Fase 4 foi estritamente de dominio puro (entidades, VOs, portas e excecoes), sem introducao/alteracao de configuracao externa ou variaveis de ambiente

---

## Fase 5 — Infrastructure Layer (Adapters, Migrations, Seed) (2026-07-03)

### ✅ Implementacoes concluídas

- ORM Entities TypeORM entregues para `users`, `brands`, `models` e `vehicles` com metadados obrigatorios (`created_at`, `updated_at`, `created_by`) e `deleted_at` para soft delete
- Mappers Domain ↔ ORM implementados: `vehicle.mapper.ts`, `model.mapper.ts`, `brand.mapper.ts`, `user.mapper.ts`
- Repositories concretos implementados para todas as portas da Fase 4: `TypeOrmVehicleRepository`, `TypeOrmModelRepository`, `TypeOrmBrandRepository`, `TypeOrmUserRepository`
- Adapter de cache Redis entregue (`RedisCacheService`) com `get/set/del/delByPattern`, TTL por env e fail graceful
- Adapter de mensageria RabbitMQ entregue (`RabbitmqEventPublisher`) com confirm/retry/backoff/DLQ e fail graceful
- Adapter de auditoria Mongo entregue (`MongoAuditLogger`) + schema com indices relevantes e TTL parametrizavel
- Listeners assincronos resilientes entregues (`service-audit.listener.ts` e `vehicle-messaging.listener.ts`) com `@OnEvent(..., { async: true })`, sem rethrow e com `eventId`
- Migrations SQL Server criadas para users/brands/models/vehicles com SQL raw e indices unicos filtrados para ativos (`deleted_at IS NULL`) em `license_plate`, `chassis`, `renavam`
- Seed idempotente entregue (`seed.ts` + `seed_vehicles.json`) com usuario padrao `aivacol` e hash de senha
- Wiring dos modulos de feature atualizado (`vehicles.module.ts`, `models.module.ts`, `brands.module.ts`, `users.module.ts`) com tokens de injecao corretos

### 🧪 Comandos executados

- `git checkout main && git pull origin main && git checkout -b feat/phase-5-infra-adapters`
- `docker compose run --rm app npm run lint`
- `docker compose run --rm app npm run lint:fix`
- `docker compose run --rm app npm run typecheck`
- `docker compose up --build -d`
- `docker compose run --rm app npm run migration:run`
- `docker compose run --rm app npm run seed`
- `docker compose exec redis redis-cli ping`
- `docker compose exec rabbitmq rabbitmq-diagnostics -q ping`
- `docker compose exec mongodb mongosh --quiet --eval "db.adminCommand('ping').ok"`
- Validacao SQL do cenario create -> soft delete -> recreate via `sqlcmd` no container do SQL Server
- Validacao SQL dos indices filtrados via `sys.indexes`

### 📌 Evidencias de validacao

- `npm run lint`: **OK** (container)
- `npm run lint:fix`: **OK** (container)
- `npm run typecheck`: **OK** (container)
- Migrations: **4/4 aplicadas com sucesso** (`CreateUsersTable`, `CreateBrandsTable`, `CreateModelsTable`, `CreateVehiclesTable`)
- Seed: **OK**, com criacao de usuario `aivacol`, brands/models e veiculos de exemplo
- Redis: **PONG**
- RabbitMQ: **Ping succeeded**
- MongoDB: **1** em `db.adminCommand('ping').ok`

### 🧾 Evidencia dos indices filtrados (ADR-004)

Consulta executada em `sys.indexes` retornou:

- `UQ_vehicles_license_plate_active` -> `is_unique=1`, `filter_definition=([deleted_at] IS NULL)`
- `UQ_vehicles_chassis_active` -> `is_unique=1`, `filter_definition=([deleted_at] IS NULL)`
- `UQ_vehicles_renavam_active` -> `is_unique=1`, `filter_definition=([deleted_at] IS NULL)`

### 🔁 Evidencia do cenario create -> soft delete -> recreate

Teste SQL executado para chave de negocio `TES9T99` / `9BWZZZ377VT004299` / `24999999949`:

- Insercao inicial do veiculo: **OK**
- Soft delete (`deleted_at` preenchido): **OK**
- Recriacao com mesma placa/chassi/renavam: **OK**
- Resultado final:
  - `active_count = 1`
  - `total_count = 2`

Comprovacao de que a unicidade vale apenas para registro ativo.

### ⚠️ Problemas encontrados e correcoes

- **Falha de lint por CRLF historico em arquivos de dominio**: resolvido com `npm run lint:fix` no container e revalidacao com `npm run lint`
- **Typecheck no mapper de vehicle (construtores privados de VO)**: corrigido para uso de `LicensePlate.create`, `Chassis.create`, `Renavam.create`
- **Typecheck no `messaging.module.ts` (assinatura de `forRootAsync`)**: corrigido para chamada compativel com a versao instalada
- **Teste SQL direto com indices filtrados exigindo `QUOTED_IDENTIFIER ON`**: corrigido com `SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;` nas consultas de validacao

### ✅ Conformidade com governanca (MASTER)

- Secao 5.7 (comentarios): **aderente**
  - Comentarios tecnicos nao obvios adicionados em adapters criticos (Redis, RabbitMQ, Mongo audit)
  - Comentarios em migrations com SQL raw e indices filtrados
  - Comentarios de resiliência nos listeners (never throw / fire-and-forget)
  - Comentario de idempotencia no seed
- Secao 5.8 (env/config fail-fast): **aderente**
  - `database.config.ts` atualizado para suportar TS/JS em migrations/entities sem quebrar startup de runtime e CLI
  - Adapters com comportamento fail graceful para dependencias externas (cache/messaging/audit)

### 🔜 Proximos passos (Fase 6)

- Implementar camada Application + Presentation (services, DTOs, controllers e auth/login)
- Integrar emissoes de eventos de auditoria e mensageria a partir dos casos de uso
- Documentar contratos Swagger completos e respostas padronizadas por `error code`

### 🔄 Reconciliacao de tracking pós-Fase 5

- Ajuste de rastreabilidade aplicado no `task.md` para marcar itens ja implementados e comprovados:
  - documentacao de `password_hash` no `README.md`
  - trade-off `@golevelup/nestjs-rabbitmq` vs `@nestjs/microservices` em README + ADR
  - commit da fase 5 com mensagem prevista no checklist
- `struct.md` atualizado tambem no bloco **Esqueleto de Navegacao (Humano)** para refletir a arvore real apos os arquivos criados na fase
- Reforco adicional de comentarios tecnicos pontuais (secao 5.7) em repositories para melhorar manutencao humana sem poluicao de codigo

---

## Fase 6 — Application + Presentation Layer (2026-07-03)

### ✅ Preflight executado na branch da fase

- `docker compose up --build -d`: **OK**
- `docker compose run --rm app npm run migration:run`: **OK** (No migrations are pending)
- `docker compose run --rm app npm run seed`: **OK**
- `GET http://localhost:3000/api/docs`: **200**

### ⚠️ Correcoes aplicadas durante preflight/validacao

- Ajuste em `src/config/database.config.ts` para resolver glob de entities/migrations com `join(...)` por runtime (evitando `Cannot use import statement outside a module` no bootstrap)
- Ajuste em `src/modules/users/infrastructure/persistence/repositories/typeorm-user.repository.ts` para `addSelect('user.passwordHash')` (evitou `passwordHash` indefinido no login)
- Correcao de dados de seed em `seed_vehicles.json` para RENAVAM com digito verificador valido
- Correcao de idempotencia no `seed.ts` para atualizar tambem `licensePlate/chassis/renavam` ao atualizar veiculos existentes
- Correcao de comparacao de IDs no `vehicle.service.ts` (case-insensitive) para evitar falso conflito em `update`
- Soft delete tecnico de registro legado de teste (`TES9T99`) com RENAVAM invalido que estava contaminando listagem

### ✅ Implementacoes entregues (escopo da Fase 6)

- Auth:
  - `auth.service.ts` com login por nickname + password, `bcrypt.compare`, `JwtService.signAsync`, auditoria `AUTH`
  - `login.dto.ts` com validacao e Swagger
  - `auth.controller.ts` com rota publica `POST /api/v1/auth/login` e respostas 201/400/401/429
  - `auth.module.ts` com wiring final de service/controller
- Vehicles:
  - `vehicle.service.ts` com CRUD completo, soft delete, paginacao defensiva, cache Redis em listagem e por id, invalidacao em mutacoes, eventos `vehicle.created` e `vehicle.updated`, auditoria em todos os metodos
  - DTOs `create/update/response` entregues
  - `vehicle.controller.ts` com Swagger completo (200/201/400/401/404/409/429) e `@ApiBearerAuth`
- Models:
  - CRUD completo em `model.service.ts`, DTOs e `model.controller.ts`
  - associacao obrigatoria com `brandId`
  - auditoria `audit.service_interaction` em create/read/update/delete
- Brands:
  - CRUD completo em `brand.service.ts`, DTOs e `brand.controller.ts`
  - auditoria `audit.service_interaction` em create/read/update/delete
- Users:
  - `user.service.ts` com `findAll/findById`, `user-response.dto.ts`, `user.controller.ts`
  - sem exposicao de `password_hash` no contrato publico
  - auditoria de consultas
- Erros e filtro global:
  - expansao de `error-catalog.ts` com codigos estaveis exigidos da fase
  - integracao no `GlobalExceptionFilter` para priorizar mensagem/status PT-BR do catalogo quando houver `code`

### 🧪 Comandos executados (gates e validacao)

- Qualidade/gates:
  - `docker compose run --rm app npm run lint`
  - `docker compose run --rm app npm run lint:fix`
  - `docker compose run --rm app npm run typecheck`
- Preflight:
  - `docker compose up --build -d`
  - `docker compose run --rm app npm run migration:run`
  - `docker compose run --rm app npm run seed`
- Validacao funcional via HTTP (container `app`):
  - login, 401 sem token, CRUD vehicles/models/brands, consultas users
- Evidencias infra:
  - MongoDB audit logs via `mongosh`
  - Redis key/value cache de vehicles via `redis-cli`
  - RabbitMQ eventos `vehicle.created`/`vehicle.updated` via fila temporaria `phase6-events`

### 📌 Evidencias objetivas de validacao

- Login JWT: `LOGIN_STATUS 201 HAS_TOKEN true`
- Rotas protegidas sem token: `UNAUTHORIZED_STATUS 401`
- Swagger: `SWAGGER_STATUS 200`
- CRUD Vehicles: `VEHICLE_CREATE_STATUS 201`, `VEHICLE_LIST_1_STATUS 200`, `VEHICLE_LIST_2_STATUS 200`, `VEHICLE_GET_1_STATUS 200`, `VEHICLE_GET_2_STATUS 200`, `VEHICLE_UPDATE_STATUS 200`, `VEHICLE_DELETE_STATUS 200`
- CRUD Models: `MODEL_CREATE_STATUS 201`, `MODEL_GET_STATUS 200`, `MODEL_LIST_STATUS 200`, `MODEL_UPDATE_STATUS 200`, `MODEL_DELETE_STATUS 200`
- CRUD Brands: `BRAND_CREATE_STATUS 201`, `BRAND_GET_STATUS 200`, `BRAND_LIST_STATUS 200`, `BRAND_UPDATE_STATUS 200`, `BRAND_DELETE_STATUS 200`
- Users protegido: `USERS_LIST_STATUS 200 HAS_PASSWORD_FIELD false`, `USERS_GET_STATUS 200`
- Cache Redis efetivo:
  - logs de latencia: primeira listagem `durationMs` maior e segunda `durationMs` proxima de zero para mesma chave
  - chave comprovada: `vehicles:list:1:5:createdAt:desc` com payload serializado no Redis
- Auditoria MongoDB:
  - registros recentes com `action`/`entity`: `AUTH`, `BRAND`, `MODEL`, `VEHICLE`, `USER`
  - metadata com `operation` e `correlationId`
- RabbitMQ:
  - exchange `fleet-events` presente
  - captura em fila temporaria mostrou mensagens `vehicle.created` e `vehicle.updated` com payload e metadados (`eventId`, `occurredAt`, `correlationId`)

### 📝 Comentarios de qualidade (secao 5.7)

- `src/modules/auth/application/services/auth.service.ts`: comentario de trade-off de seguranca contra enumeracao de credenciais
- `src/modules/vehicles/application/services/vehicle.service.ts`: comentario sobre estrategia de chaves de cache/invalidacao por pattern
- `src/modules/vehicles/presentation/controllers/vehicle.controller.ts`: comentario de contrato para centralizar normalizacao de query no service
- `src/common/filters/global-exception.filter.ts`: comentario no mapeamento de mensagens framework -> contrato PT-BR estavel

### 🔜 Proximos passos (Fase 7)

- Iniciar Fase 7 focada em testes unitarios/e2e e cobertura global >= 90%
- Cobrir casos de erro por `code` estavel e cenarios de cache/eventos/auditoria em testes automatizados
