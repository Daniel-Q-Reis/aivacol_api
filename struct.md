# struct.md — Mapa de Arquivos do Projeto

> Arquitetura adotada: backend unico em NestJS com Clean Architecture (Domain, Application, Presentation e Infrastructure), desacoplamento por portas/adapters e eventos internos.
> **Atualizado automaticamente pelas IAs executoras ao final de cada ciclo.**
> Última atualização: 2026-07-03 (Fase 8 — Documentacao, Benchmark, CI e Finalizacao)
> Nota: este arquivo lista somente o que ja existe no repositorio (nao e roadmap preditivo).

## Regra de Atualização

Ao final de CADA ciclo de trabalho:

1. Executar `git status`
2. Para cada arquivo **criado** (new file) → adicionar à tabela abaixo com caminho e propósito
3. Para cada arquivo **deletado** → remover da tabela
4. **NUNCA criar arquivos duplicados** — consultar esta tabela ANTES de criar qualquer arquivo
5. Atualizar tambem o **Esqueleto de Navegacao (Humano)** para espelhar os arquivos/pastas existentes no ciclo (sem antecipar roadmap)

---

## Esqueleto de Navegacao (Humano)

> Referencia de navegacao da arquitetura escolhida (visao humana).  
> A tabela "Arquivos do Projeto" abaixo continua sendo a fonte objetiva dos arquivos existentes.
> Regra de padrao: refletir somente o que existe agora no repositorio, listar diretorios primeiro e itens da raiz por ultimo (de cima para baixo).

```text
aivacol_api/                                     # Raiz do repositorio backend unico
├── .agents/                                     # Artefatos auxiliares gerados por ferramentas de execucao
├── .github/                                     # Configuracoes de automacao no GitHub
│   └── workflows/
│       └── ci.yml                               # Pipeline CI para push/PR na main
├── docs/                                        # Base documental de decisoes e runbooks
│   ├── adr/                                     # ADRs de arquitetura e trade-offs tecnicos
│   │   ├── ADR-001-clean-architecture.md        # Decisao de Clean Architecture com ports/adapters
│   │   ├── ADR-002-event-driven-decoupling.md   # Decisao de desacoplamento interno via eventos
│   │   ├── ADR-003-data-lifecycle-soft-delete-and-audit.md # Ciclo de vida de dados e auditoria
│   │   └── ADR-004-sqlserver-filtered-unique-indexes-with-typeorm.md # Indices filtrados no SQL Server
│   ├── performance-baseline-phase-9.md          # Baseline oficial de performance, tentativas e consolidacao da Fase 9
│   └── runbooks/                                # Guias operacionais para suporte/contingencia
│       └── infra-contingency.md                 # Runbook para falhas de infraestrutura local
├── scripts/                                     # Automacoes PowerShell/Node para ciclo de desenvolvimento
│   ├── benchmark-write.ts                       # Script de benchmark de escrita isolada (write-only PATCH)
│   ├── benchmark.ps1                            # Executa benchmark no runner dedicado (profile tools)
│   ├── benchmark.ts                             # Script de carga (cache quente/frio) para Autocannon
│   ├── container-healthcheck.js                 # Healthcheck HTTP do container da app
│   ├── db.ps1                                   # Consultas SQL assistidas no SQL Server (status/migrations/counts/vehicles/sql)
│   ├── dev-container-start.js                   # Boot da app com wait-for-deps e fallback da Fase 1
│   ├── dev.ps1                                  # Sobe stack Docker com build
│   ├── lint.ps1                                 # Executa lint/lint:fix/typecheck no container app
│   ├── logs.ps1                                 # Exibe logs de servico no Docker Compose
│   ├── migrate.ps1                              # Executa migrations no container app
│   ├── placeholder-app.js                       # Servidor placeholder para manter app healthy na Fase 1
│   ├── seed.ps1                                 # Executa seed no container app
│   ├── stop.ps1                                 # Desliga stack e remove orfaos
│   ├── test-e2e.ps1                             # Executa testes end-to-end no container app
│   ├── test.ps1                                 # Executa cobertura de testes no container app
│   └── wait-for-deps.js                         # Espera ativa das dependencias antes do bootstrap
├── src/                                         # Codigo-fonte da aplicacao NestJS
│   └── types/
│       └── autocannon.d.ts                      # Declaracao de tipos para integracao de benchmark via CLI
│   ├── common/                                  # Cross-cutting concerns e contratos HTTP/erro
│   │   ├── constants/
│   │   │   └── http-context.constants.ts        # Chaves de contexto HTTP (correlation/public metadata)
│   │   ├── controllers/
│   │   │   └── health.controller.ts             # Health check protegido com validacao de dependencias
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts        # Extrai usuario autenticado do request
│   │   │   └── public.decorator.ts              # Marca rotas publicas (bypass do guard global)
│   │   ├── domain/
│   │   │   ├── exceptions/                      # Hierarquia de excecoes de dominio com code estavel
│   │   │   ├── interfaces/                      # Portas puras compartilhadas (cache/event/audit)
│   │   │   └── value-objects/                   # VOs imutaveis (placa/chassi/renavam)
│   │   ├── errors/
│   │   │   └── error-catalog.ts                 # Catalogo central de erros e status HTTP
│   │   ├── filters/
│   │   │   ├── global-exception.filter.ts       # Padroniza payloads de erro da API
│   │   │   └── throttler-exception.filter.ts    # Resposta padrao para limite de taxa (429)
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts                # Guard JWT global com suporte a @Public
│   │   │   └── throttler.guard.ts               # Guard global de throttling
│   │   ├── interfaces/
│   │   │   └── authenticated-request.interface.ts # Tipagem de request autenticada
│   │   ├── interceptors/
│   │   │   ├── correlation-id.interceptor.ts    # Propaga correlation-id na resposta/contexto
│   │   │   └── logging.interceptor.ts           # Logging estruturado de requests/responses
│   │   └── middleware/
│   │       └── correlation-id.middleware.ts     # Injeta correlation-id no inicio da pipeline HTTP
│   ├── config/                                  # Factories de configuracao por dominio tecnico
│   │   ├── audit.config.ts                      # Configuracao fail-fast de auditoria MongoDB
│   │   ├── auth.config.ts                       # Configuracao fail-fast de autenticacao JWT
│   │   ├── cache.config.ts                      # Configuracao fail-fast de cache Redis
│   │   ├── cors.config.ts                       # Parse e validacao de allowlist CORS
│   │   ├── database.config.ts                   # Configuracao TypeORM/SQL Server + DataSource
│   │   ├── messaging.config.ts                  # Configuracao fail-fast de RabbitMQ
│   │   └── throttle.config.ts                   # Configuracao fail-fast de throttling
│   ├── infrastructure/                          # Adapters concretos de persistencia e integracao externa
│   │   ├── audit/
│   │   │   ├── listeners/
│   │   │   │   └── service-audit.listener.ts    # Listener assincrono de auditoria (fire-and-forget)
│   │   │   ├── schemas/
│   │   │   │   └── audit-log.schema.ts          # Schema Mongo de trilha de auditoria com indices/TTL
│   │   │   ├── audit.module.ts                  # Modulo de auditoria com binding do token AUDIT_LOGGER
│   │   │   └── mongo-audit-logger.ts            # Adapter Mongo que implementa IAuditLogger
│   │   ├── cache/
│   │   │   ├── cache.module.ts                  # Modulo de cache com provider para ICacheService
│   │   │   └── redis-cache.service.ts           # Adapter Redis com fallback graceful e invalidacao por pattern
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   │   ├── 1761900000000-CreateUsersTable.ts    # DDL users + indices de ativo
│   │   │   │   ├── 1761900001000-CreateBrandsTable.ts   # DDL brands + FK para users
│   │   │   │   ├── 1761900002000-CreateModelsTable.ts   # DDL models + FK para brands
│   │   │   │   └── 1761900003000-CreateVehiclesTable.ts # DDL vehicles + indices filtrados ADR-004
│   │   │   └── seeds/
│   │   │       └── seed.ts                       # Seed idempotente para usuario/brand/model/vehicle
│   │   ├── lifecycle/
│   │   │   └── graceful-shutdown.service.ts      # Encerramento ordenado de conexoes externas
│   │   └── messaging/
│   │       ├── messaging.module.ts               # Modulo RabbitMQ para provider de IEventPublisher
│   │       └── rabbitmq-event-publisher.ts       # Adapter RabbitMQ com confirm/retry/backoff/DLQ
│   ├── modules/                                  # Modulos de feature (dominio + app + presentation + infra)
│   │   ├── auth/
│   │   │   ├── application/
│   │   │   │   ├── dtos/
│   │   │   │   │   └── login.dto.ts              # DTO de entrada para autenticacao por nickname/senha
│   │   │   │   └── services/
│   │   │   │       └── auth.service.ts           # Caso de uso de login (bcrypt + JWT + auditoria)
│   │   │   ├── infrastructure/
│   │   │   │   └── strategies/
│   │   │   │       └── jwt.strategy.ts           # Estrategia JWT (Passport)
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── auth.controller.ts        # Endpoint publico POST /auth/login com Swagger
│   │   │   └── auth.module.ts                    # Wiring do modulo Auth
│   │   ├── brands/
│   │   │   ├── application/
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── brand-response.dto.ts     # DTO de resposta publica para marcas
│   │   │   │   │   ├── create-brand.dto.ts       # DTO de criacao de marca
│   │   │   │   │   └── update-brand.dto.ts       # DTO de atualizacao parcial de marca
│   │   │   │   ├── mappers/brand.mapper.ts       # Conversao Domain <-> ORM de Brand
│   │   │   │   └── services/
│   │   │   │       └── brand.service.ts          # Casos de uso CRUD de marcas com auditoria
│   │   │   ├── domain/
│   │   │   │   ├── entities/brand.entity.ts      # Entidade de dominio Brand
│   │   │   │   └── interfaces/brand-repository.interface.ts # Porta IBrandRepository
│   │   │   ├── infrastructure/
│   │   │   │   └── persistence/
│   │   │   │       ├── entities/brand.orm-entity.ts # Entidade TypeORM de brands
│   │   │   │       └── repositories/typeorm-brand.repository.ts # Repo concreto TypeORM
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── brand.controller.ts       # Endpoints REST de marcas
│   │   │   └── brands.module.ts                  # Wiring do modulo Brands
│   │   ├── models/
│   │   │   ├── application/
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-model.dto.ts       # DTO de criacao de modelo com brandId
│   │   │   │   │   ├── model-response.dto.ts      # DTO de resposta publica para modelos
│   │   │   │   │   └── update-model.dto.ts       # DTO de atualizacao parcial de modelo
│   │   │   │   ├── mappers/model.mapper.ts       # Conversao Domain <-> ORM de Model
│   │   │   │   └── services/
│   │   │   │       └── model.service.ts          # Casos de uso CRUD de modelos com auditoria
│   │   │   ├── domain/
│   │   │   │   ├── entities/model.entity.ts      # Entidade de dominio Model
│   │   │   │   └── interfaces/model-repository.interface.ts # Porta IModelRepository
│   │   │   ├── infrastructure/
│   │   │   │   └── persistence/
│   │   │   │       ├── entities/model.orm-entity.ts # Entidade TypeORM de models
│   │   │   │       └── repositories/typeorm-model.repository.ts # Repo concreto TypeORM
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── model.controller.ts       # Endpoints REST de modelos
│   │   │   └── models.module.ts                  # Wiring do modulo Models
│   │   ├── users/
│   │   │   ├── application/
│   │   │   │   ├── dtos/
│   │   │   │   │   └── user-response.dto.ts      # DTO de resposta sem password_hash
│   │   │   │   ├── mappers/user.mapper.ts        # Conversao Domain <-> ORM de User
│   │   │   │   └── services/
│   │   │   │       └── user.service.ts           # Casos de uso de consulta protegida de usuarios
│   │   │   ├── domain/
│   │   │   │   ├── entities/user.entity.ts       # Entidade de dominio User
│   │   │   │   └── interfaces/user-repository.interface.ts # Porta IUserRepository
│   │   │   ├── infrastructure/
│   │   │   │   └── persistence/
│   │   │   │       ├── entities/user.orm-entity.ts # Entidade TypeORM de users
│   │   │   │       └── repositories/typeorm-user.repository.ts # Repo concreto TypeORM
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── user.controller.ts        # Endpoints GET /users e GET /users/:id
│   │   │   └── users.module.ts                   # Wiring do modulo Users
│   │   └── vehicles/
│   │       ├── application/
│   │       │   ├── dtos/
│   │       │   │   ├── create-vehicle.dto.ts     # DTO de criacao de veiculo
│   │       │   │   ├── update-vehicle.dto.ts     # DTO de atualizacao parcial de veiculo
│   │       │   │   └── vehicle-response.dto.ts   # DTOs de resposta de veiculo (item/lista)
│   │       │   ├── mappers/vehicle.mapper.ts     # Conversao Domain <-> ORM de Vehicle
│   │       │   └── services/
│   │       │       └── vehicle.service.ts        # Casos de uso CRUD com cache/eventos/auditoria
│   │       ├── domain/
│   │       │   ├── entities/vehicle.entity.ts    # Entidade de dominio Vehicle
│   │       │   └── interfaces/vehicle-repository.interface.ts # Porta IVehicleRepository
│   │       ├── infrastructure/
│   │       │   ├── listeners/vehicle-messaging.listener.ts # Listener de eventos de veiculo -> broker
│   │       │   └── persistence/
│   │       │       ├── entities/vehicle.orm-entity.ts # Entidade TypeORM de vehicles
│   │       │       └── repositories/typeorm-vehicle.repository.ts # Repo concreto TypeORM
│   │       ├── presentation/
│   │       │   └── controllers/
│   │       │       └── vehicle.controller.ts     # Endpoints REST de veiculos
│   │       └── vehicles.module.ts                # Wiring do modulo Vehicles
│   ├── app.controller.spec.ts                    # Teste unitario inicial do controller
│   ├── app.controller.ts                         # Endpoint basico de health
│   ├── app.module.ts                             # Modulo raiz com imports globais e infraestrutura
│   ├── app.service.ts                            # Service basico de health
│   └── main.ts                                   # Bootstrap NestJS (pipes, Swagger, CORS, prefixo, shutdown)
├── test/                                         # Testes end-to-end e utilitarios de suite
│   └── e2e/
│       ├── auth.e2e-spec.ts                      # Fluxos de autenticacao e autorizacao JWT
│       ├── brands.e2e-spec.ts                    # CRUD e validacoes de marcas
│       ├── health.e2e-spec.ts                    # Health protegido com e sem token
│       ├── models.e2e-spec.ts                    # CRUD e validacoes de modelos
│       ├── rate-limit.e2e-spec.ts                # Limite global com 429 e code estavel
│       ├── vehicles.e2e-spec.ts                  # CRUD/validacoes e soft delete/recriacao
│       └── helpers/
│           ├── auth.helper.ts                    # Helper de login para suites e2e
│           └── test-app.factory.ts               # Factory e2e com prefixo global e bootstrap
├── .dockerignore                                 # Exclusoes de contexto de build Docker
├── .eslintrc.js                                  # Configuracao ESLint com TypeScript + Prettier
├── .env.example                                  # Template de variaveis sem segredos
├── .gitignore                                    # Regras de exclusao de artefatos locais
├── .prettierrc                                   # Regras de formatacao Prettier
├── ACHIEVEMENTS.md                               # Registro de entregas e evidencias por fase
├── Dockerfile                                    # Build multistage para desenvolvimento e producao
├── MASTER.md                                     # Fonte de verdade de arquitetura, regras e governanca
├── README.md                                     # Guia geral do projeto
├── docker-compose.yml                            # Orquestracao de servicos da stack local
├── implementation_plan.md                        # Plano macro de implementacao por fases
├── jest-e2e.config.ts                            # Configuracao Jest para testes e2e
├── jest.config.ts                                # Configuracao Jest para testes unitarios/cobertura
├── nest-cli.json                                 # Configuracao do Nest CLI com plugin Swagger
├── objetivos.md                                  # Requisitos originais do desafio
├── package-lock.json                             # Lockfile npm para reproducibilidade de dependencias
├── package.json                                  # Manifesto npm com scripts e dependencias fixas
├── aivacol-postman-collection.json               # Colecao Postman final com auth automatica e pastas por dominio
├── seed_vehicles.json                            # Dataset de seed de veiculos para bootstrap local
├── struct.md                                     # Mapa de arquivos + esqueleto de navegacao humano
├── task.md                                       # Checklist de execucao por fase
├── tsconfig.build.json                           # Configuracao TypeScript para build
└── tsconfig.json                                 # Configuracao TypeScript strict com aliases
```

---

## Arquivos do Projeto

| Arquivo                                                                  | Propósito                                                                                     |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `objetivos.md`                                                           | Documento original do desafio (requisitos completos)                                          |
| `MASTER.md`                                                              | Documento-mestre: visão geral, arquitetura, regras, convenções, tecnologias                   |
| `implementation_plan.md`                                                 | Plano de implementação detalhado em 8 fases                                                   |
| `task.md`                                                                | Checklist granular de tarefas para tracking de progresso                                      |
| `struct.md`                                                              | Este arquivo — mapa de arquivos do projeto (fonte de verdade)                                 |
| `ACHIEVEMENTS.md`                                                        | Registro do que foi implementado em cada fase/bloco                                           |
| `README.md`                                                              | Documentacao inicial do projeto com checklist e diferenciais                                  |
| `.gitignore`                                                             | Regras de exclusao de arquivos locais/temporarios do Git                                      |
| `docs/adr/ADR-001-clean-architecture.md`                                 | ADR da decisao de arquitetura limpa com ports and adapters                                    |
| `docs/adr/ADR-002-event-driven-decoupling.md`                            | ADR da estrategia de desacoplamento interno com eventos                                       |
| `docs/adr/ADR-003-data-lifecycle-soft-delete-and-audit.md`               | ADR da estrategia de soft delete e auditoria complementar                                     |
| `docs/adr/ADR-004-sqlserver-filtered-unique-indexes-with-typeorm.md`     | ADR da decisao de usar SQL raw em migrations para indices filtrados no SQL Server             |
| `docs/runbooks/infra-contingency.md`                                     | Runbook de contingencia para falhas de infraestrutura e recuperacao operacional               |
| `docker-compose.yml`                                                     | Orquestracao Docker da Fase 1 com app, sqlserver, redis, rabbitmq, mongodb e benchmark-runner |
| `Dockerfile`                                                             | Build multistage (dev, builder, production) com usuario nao-root e healthcheck no stage final |
| `.dockerignore`                                                          | Exclusoes de contexto de build Docker para reduzir ruido e tempo de build                     |
| `.env`                                                                   | Variaveis locais de ambiente para desenvolvimento via Docker Compose (arquivo nao versionado) |
| `.env.example`                                                           | Template de variaveis de ambiente sem segredos para onboarding/reproducao                     |
| `scripts/dev.ps1`                                                        | Sobe a stack com build e mostra status dos servicos                                           |
| `scripts/stop.ps1`                                                       | Desliga containers e remove orfaos da stack local                                             |
| `scripts/logs.ps1`                                                       | Stream de logs por servico via Docker Compose                                                 |
| `scripts/test.ps1`                                                       | Executa cobertura de testes no container app (com fallback N/A na Fase 1)                     |
| `scripts/test-e2e.ps1`                                                   | Executa testes E2E no container app (com fallback N/A na Fase 1)                              |
| `scripts/lint.ps1`                                                       | Executa lint, lint:fix e typecheck no container app (com fallback N/A na Fase 1)              |
| `scripts/migrate.ps1`                                                    | Executa migrations via container app (com fallback N/A na Fase 1)                             |
| `scripts/seed.ps1`                                                       | Executa seed via container app (com fallback N/A na Fase 1)                                   |
| `scripts/benchmark.ps1`                                                  | Entrada oficial de benchmark com `docker compose --profile tools run --rm benchmark-runner`   |
| `scripts/benchmark.ts`                                                   | Cenarios de benchmark (cache quente/frio) com base padrao `http://app:3000`                   |
| `scripts/wait-for-deps.js`                                               | Espera ativa de dependencias TCP antes do bootstrap da app                                    |
| `scripts/dev-container-start.js`                                         | Orquestra boot da app no container (wait-for-deps + fallback ate Fase 2)                      |
| `scripts/placeholder-app.js`                                             | Servidor placeholder para manter app healthy durante a Fase 1                                 |
| `scripts/container-healthcheck.js`                                       | Healthcheck HTTP interno usado no compose e no stage production                               |
| `.agents/`                                                               | Artefato gerado automaticamente por ferramentas CLI; sem impacto funcional na aplicacao       |
| `package.json`                                                           | Manifesto do projeto NestJS com scripts de qualidade, testes, migracoes, seed e benchmark     |
| `package-lock.json`                                                      | Lockfile npm com arvore de dependencias fixada para reproducibilidade                         |
| `.eslintrc.js`                                                           | Configuracao ESLint com TypeScript e integracao Prettier                                      |
| `.prettierrc`                                                            | Regras de formatacao Prettier (singleQuote, trailingComma, printWidth)                        |
| `nest-cli.json`                                                          | Configuracao do Nest CLI com plugin Swagger habilitado                                        |
| `tsconfig.json`                                                          | Configuracao TypeScript strict com aliases de path                                            |
| `tsconfig.build.json`                                                    | Configuracao TypeScript para build de producao                                                |
| `jest.config.ts`                                                         | Configuracao de testes unitarios com thresholds globais de cobertura                          |
| `jest-e2e.config.ts`                                                     | Configuracao dedicada para testes e2e                                                         |
| `src/main.ts`                                                            | Bootstrap da aplicacao com ValidationPipe global, CORS allowlist, Swagger e prefixo `/api/v1` |
| `src/app.module.ts`                                                      | Modulo raiz com ConfigModule global, TypeORM async, Mongoose async e EventEmitter             |
| `src/app.controller.ts`                                                  | Controller basico de health em `/api/v1/health`                                               |
| `src/app.service.ts`                                                     | Service basico de health retornando status operacional                                        |
| `src/app.controller.spec.ts`                                             | Teste unitario inicial do endpoint de health                                                  |
| `test/e2e/auth.e2e-spec.ts`                                              | Suite e2e de autenticacao e autorizacao JWT                                                   |
| `test/e2e/vehicles.e2e-spec.ts`                                          | Suite e2e de CRUD de veiculos, validacoes e soft delete/recriacao                             |
| `test/e2e/models.e2e-spec.ts`                                            | Suite e2e de CRUD de modelos e cenarios de erro                                               |
| `test/e2e/brands.e2e-spec.ts`                                            | Suite e2e de CRUD de marcas e cenarios de erro                                                |
| `test/e2e/health.e2e-spec.ts`                                            | Suite e2e de health protegido (401/200)                                                       |
| `test/e2e/rate-limit.e2e-spec.ts`                                        | Suite e2e de throttling com `RATE_LIMIT_EXCEEDED`                                             |
| `test/e2e/helpers/auth.helper.ts`                                        | Helper para autenticacao reutilizavel nos testes e2e                                          |
| `test/e2e/helpers/test-app.factory.ts`                                   | Factory de app e2e com prefixo `/api/v1` e setup consistente                                  |
| `src/config/database.config.ts`                                          | Factory de configuracao do TypeORM/SQL Server com pool e timeout por env                      |
| `src/config/cache.config.ts`                                             | Factory de configuracao Redis (host, port, ttl)                                               |
| `src/config/messaging.config.ts`                                         | Factory de configuracao RabbitMQ e URI AMQP                                                   |
| `src/config/audit.config.ts`                                             | Factory de configuracao de auditoria MongoDB                                                  |
| `src/config/auth.config.ts`                                              | Factory de configuracao JWT (secret e expiresIn)                                              |
| `src/config/cors.config.ts`                                              | Parse e validacao fail-fast da allowlist CORS por `CORS_ORIGINS`                              |
| `src/config/throttle.config.ts`                                          | Parse e validacao fail-fast de throttling global                                              |
| `src/modules/vehicles/vehicles.module.ts`                                | Placeholder do modulo de feature Vehicles para wiring futuro                                  |
| `src/modules/models/models.module.ts`                                    | Placeholder do modulo de feature Models para wiring futuro                                    |
| `src/modules/brands/brands.module.ts`                                    | Placeholder do modulo de feature Brands para wiring futuro                                    |
| `src/modules/users/users.module.ts`                                      | Placeholder do modulo de feature Users para wiring futuro                                     |
| `src/modules/auth/auth.module.ts`                                        | Placeholder do modulo de feature Auth para wiring futuro                                      |
| `src/common/constants/http-context.constants.ts`                         | Constantes centralizadas de contexto HTTP (correlation-id e metadata de rota publica)         |
| `src/common/interfaces/authenticated-request.interface.ts`               | Contratos tipados para request autenticada e payload JWT no contexto HTTP                     |
| `src/common/decorators/public.decorator.ts`                              | Decorator `@Public()` para marcar endpoints que devem ignorar autenticacao global             |
| `src/common/decorators/current-user.decorator.ts`                        | Decorator `@CurrentUser()` para extrair usuario/payload JWT do request                        |
| `src/common/middleware/correlation-id.middleware.ts`                     | Middleware de captura precoce e propagacao de correlation ID                                  |
| `src/common/interceptors/correlation-id.interceptor.ts`                  | Interceptor para garantir correlation ID no ciclo HTTP e no header de resposta                |
| `src/common/interceptors/logging.interceptor.ts`                         | Interceptor global de logs de request/response com metodo, rota, status, tempo e userId       |
| `src/common/filters/global-exception.filter.ts`                          | Filtro global para padronizar erros HTTP/Domain/500 com correlation ID                        |
| `src/common/filters/throttler-exception.filter.ts`                       | Filtro dedicado para padronizar resposta 429 com `RATE_LIMIT_EXCEEDED`                        |
| `src/common/guards/jwt-auth.guard.ts`                                    | Guard JWT global com bypass por `@Public()`                                                   |
| `src/common/guards/throttler.guard.ts`                                   | Guard global de rate limit baseado em `@nestjs/throttler`                                     |
| `src/common/controllers/health.controller.ts`                            | Endpoint protegido `/api/v1/health` com verificacao de conectores de infraestrutura           |
| `src/common/errors/error-catalog.ts`                                     | Catalogo inicial de erros estaveis com status HTTP e mensagem PT-BR                           |
| `src/common/domain/exceptions/domain.exception.ts`                       | Excecao base de dominio com `code` e `statusCode` para contrato HTTP padronizado              |
| `src/common/domain/exceptions/entity-not-found.exception.ts`             | Excecao de dominio para entidade inexistente com detalhes de rastreabilidade                  |
| `src/common/domain/exceptions/business-rule-violation.exception.ts`      | Excecao de dominio para violacao de regra de negocio                                          |
| `src/common/domain/exceptions/entity-validation.exception.ts`            | Excecao de validacao de entidade agregando lista de erros de invariantes                      |
| `src/common/domain/exceptions/duplicate-entity.exception.ts`             | Excecao de conflito para entidades duplicadas por chave de negocio                            |
| `src/common/domain/interfaces/cache-service.interface.ts`                | Porta de cache de dominio com token Symbol e contrato de invalidacao por pattern              |
| `src/common/domain/interfaces/event-publisher.interface.ts`              | Porta de publicacao de eventos com contrato desacoplado de broker                             |
| `src/common/domain/interfaces/audit-logger.interface.ts`                 | Porta de auditoria de dominio com contrato de trilha de interacao de servico                  |
| `src/common/domain/value-objects/license-plate.vo.ts`                    | Value Object de placa Mercosul com normalizacao e validacao de formato                        |
| `src/common/domain/value-objects/chassis.vo.ts`                          | Value Object de chassi/VIN com validacao de charset e tamanho fixo                            |
| `src/common/domain/value-objects/renavam.vo.ts`                          | Value Object de Renavam com normalizacao e validacao por digito verificador                   |
| `src/modules/vehicles/domain/entities/vehicle.entity.ts`                 | Entidade de dominio Vehicle com invariantes e uso de VOs obrigatorios                         |
| `src/modules/vehicles/domain/interfaces/vehicle-repository.interface.ts` | Porta de repositorio de veiculos com contrato de consulta, persistencia e soft delete         |
| `src/modules/models/domain/entities/model.entity.ts`                     | Entidade de dominio Model com invariantes de nome e metadados                                 |
| `src/modules/models/domain/interfaces/model-repository.interface.ts`     | Porta de repositorio de modelos com token de injecao Symbol                                   |
| `src/modules/brands/domain/entities/brand.entity.ts`                     | Entidade de dominio Brand com validacoes de nome e metadados                                  |
| `src/modules/brands/domain/interfaces/brand-repository.interface.ts`     | Porta de repositorio de marcas com token de injecao Symbol                                    |
| `src/modules/users/domain/entities/user.entity.ts`                       | Entidade de dominio User com normalizacao de identidade e validacao de invariantes            |
| `src/modules/users/domain/interfaces/user-repository.interface.ts`       | Porta de repositorio de usuarios com token de injecao Symbol                                  |
| `src/modules/auth/infrastructure/strategies/jwt.strategy.ts`             | Estrategia JWT do Passport para validar bearer token e normalizar payload do usuario          |
| `src/infrastructure/lifecycle/graceful-shutdown.service.ts`              | Service de shutdown graceful para fechar conexoes externas sem derrubar o bootstrap           |

### Entradas adicionadas (append) — Fase 5

| Arquivo                                                                                      | Propósito                                                                                   |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `seed_vehicles.json`                                                                         | Dataset de seed com veiculos de exemplo para bootstrap idempotente da base relacional       |
| `src/infrastructure/cache/cache.module.ts`                                                   | Modulo de cache com provider `CACHE_SERVICE` apontando para adapter Redis                   |
| `src/infrastructure/cache/redis-cache.service.ts`                                            | Adapter Redis que implementa `ICacheService` com fail graceful e invalidacao por pattern    |
| `src/infrastructure/messaging/messaging.module.ts`                                           | Modulo de mensageria RabbitMQ com exchange `fleet-events` e conexao async resiliente        |
| `src/infrastructure/messaging/rabbitmq-event-publisher.ts`                                   | Adapter RabbitMQ que implementa `IEventPublisher` com retry/backoff e fallback para DLQ     |
| `src/infrastructure/audit/audit.module.ts`                                                   | Modulo de auditoria MongoDB com binding do token `AUDIT_LOGGER`                             |
| `src/infrastructure/audit/listeners/service-audit.listener.ts`                               | Listener assincrono de auditoria que consome `audit.service_interaction` sem relancar erros |
| `src/infrastructure/audit/mongo-audit-logger.ts`                                             | Adapter Mongo que implementa `IAuditLogger` com escrita best-effort                         |
| `src/infrastructure/audit/schemas/audit-log.schema.ts`                                       | Schema Mongoose de auditoria com indices e TTL parametrizavel                               |
| `src/infrastructure/database/migrations/1761900000000-CreateUsersTable.ts`                   | Migration SQL Server para tabela `users` com indices filtrados de ativos                    |
| `src/infrastructure/database/migrations/1761900001000-CreateBrandsTable.ts`                  | Migration SQL Server para tabela `brands` e FK para `users`                                 |
| `src/infrastructure/database/migrations/1761900002000-CreateModelsTable.ts`                  | Migration SQL Server para tabela `models` com FK para `brands`                              |
| `src/infrastructure/database/migrations/1761900003000-CreateVehiclesTable.ts`                | Migration SQL Server para tabela `vehicles` com FKs e unicidade filtrada por ativo          |
| `src/infrastructure/database/seeds/seed.ts`                                                  | Seed idempotente de usuarios, marcas, modelos e veiculos com hash de senha                  |
| `src/modules/brands/application/mappers/brand.mapper.ts`                                     | Mapper bidirecional dominio/ORM para Brand                                                  |
| `src/modules/brands/infrastructure/persistence/entities/brand.orm-entity.ts`                 | ORM Entity TypeORM de `brands` com metadados e soft delete                                  |
| `src/modules/brands/infrastructure/persistence/repositories/typeorm-brand.repository.ts`     | Repositorio TypeORM concreto para a porta `IBrandRepository`                                |
| `src/modules/models/application/mappers/model.mapper.ts`                                     | Mapper bidirecional dominio/ORM para Model                                                  |
| `src/modules/models/infrastructure/persistence/entities/model.orm-entity.ts`                 | ORM Entity TypeORM de `models` com FK `brand_id` e soft delete                              |
| `src/modules/models/infrastructure/persistence/repositories/typeorm-model.repository.ts`     | Repositorio TypeORM concreto para a porta `IModelRepository`                                |
| `src/modules/users/application/mappers/user.mapper.ts`                                       | Mapper bidirecional dominio/ORM para User                                                   |
| `src/modules/users/infrastructure/persistence/entities/user.orm-entity.ts`                   | ORM Entity TypeORM de `users` com `password_hash` tecnico, metadados e soft delete          |
| `src/modules/users/infrastructure/persistence/repositories/typeorm-user.repository.ts`       | Repositorio TypeORM concreto para a porta `IUserRepository`                                 |
| `src/modules/vehicles/application/mappers/vehicle.mapper.ts`                                 | Mapper bidirecional dominio/ORM para Vehicle usando Value Objects                           |
| `src/modules/vehicles/infrastructure/listeners/vehicle-messaging.listener.ts`                | Listener assincrono de eventos de veiculo com `eventId` para idempotencia                   |
| `src/modules/vehicles/infrastructure/persistence/entities/vehicle.orm-entity.ts`             | ORM Entity TypeORM de `vehicles` com FK `model_id` e soft delete                            |
| `src/modules/vehicles/infrastructure/persistence/repositories/typeorm-vehicle.repository.ts` | Repositorio TypeORM concreto para a porta `IVehicleRepository`                              |

### Entradas adicionadas (append) — Fase 6

| Arquivo                                                               | Propósito                                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/modules/auth/application/dtos/login.dto.ts`                      | DTO de autenticacao por nickname/senha com validacao e schema Swagger                                   |
| `src/modules/auth/application/services/auth.service.ts`               | Caso de uso de login com bcrypt, JWT e emissao de auditoria `AUTH`                                      |
| `src/modules/auth/presentation/controllers/auth.controller.ts`        | Controller da rota publica `POST /api/v1/auth/login` com contrato Swagger completo                      |
| `src/modules/vehicles/application/dtos/create-vehicle.dto.ts`         | DTO de criacao de veiculo com validacoes de contrato HTTP e exemplos Swagger                            |
| `src/modules/vehicles/application/dtos/update-vehicle.dto.ts`         | DTO parcial para atualizacao de veiculo usando `PartialType`                                            |
| `src/modules/vehicles/application/dtos/vehicle-response.dto.ts`       | DTOs de serializacao de resposta de veiculos (item e listagem paginada)                                 |
| `src/modules/vehicles/application/services/vehicle.service.ts`        | Casos de uso CRUD de veiculos com cache Redis, eventos RabbitMQ e auditoria de servico                  |
| `src/modules/vehicles/presentation/controllers/vehicle.controller.ts` | Endpoints REST de veiculos com paginacao defensiva, JWT e respostas Swagger 200/201/400/401/404/409/429 |
| `src/modules/models/application/dtos/create-model.dto.ts`             | DTO de criacao de modelo associado a `brandId`                                                          |
| `src/modules/models/application/dtos/update-model.dto.ts`             | DTO parcial de atualizacao de modelo                                                                    |
| `src/modules/models/application/dtos/model-response.dto.ts`           | DTO de resposta publica para modelos                                                                    |
| `src/modules/models/application/services/model.service.ts`            | Casos de uso CRUD de modelos com validacao de associacao de marca e auditoria                           |
| `src/modules/models/presentation/controllers/model.controller.ts`     | Endpoints REST de modelos com contratos Swagger e seguranca JWT                                         |
| `src/modules/brands/application/dtos/create-brand.dto.ts`             | DTO de criacao de marca com validacao de nome                                                           |
| `src/modules/brands/application/dtos/update-brand.dto.ts`             | DTO parcial de atualizacao de marca                                                                     |
| `src/modules/brands/application/dtos/brand-response.dto.ts`           | DTO de resposta publica para marcas                                                                     |
| `src/modules/brands/application/services/brand.service.ts`            | Casos de uso CRUD de marcas com auditoria de leitura/mutacao                                            |
| `src/modules/brands/presentation/controllers/brand.controller.ts`     | Endpoints REST de marcas com cobertura Swagger completa                                                 |
| `src/modules/users/application/dtos/user-response.dto.ts`             | DTO de resposta de usuarios sem exposicao de `password_hash`                                            |
| `src/modules/users/application/services/user.service.ts`              | Casos de uso de consulta protegida de usuarios com auditoria `READ`                                     |
| `src/modules/users/presentation/controllers/user.controller.ts`       | Endpoints `GET /users` e `GET /users/:id` protegidos por JWT e documentados no Swagger                  |

### Entradas adicionadas (append) — Fase 7

| Arquivo                                                                                           | Propósito                                                                          |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/common/controllers/health.controller.spec.ts`                                                | Testes unitarios de health cobrindo sql/redis/rabbit/mongo e probe TCP             |
| `src/common/decorators/current-user.decorator.spec.ts`                                            | Testes unitarios do extractor de usuario autenticado                               |
| `src/common/domain/exceptions/business-rule-violation.exception.spec.ts`                          | Teste unitario da excecao de regra de negocio                                      |
| `src/common/domain/value-objects/chassis.vo.spec.ts`                                              | Testes unitarios do VO de chassi                                                   |
| `src/common/domain/value-objects/license-plate.vo.spec.ts`                                        | Testes unitarios do VO de placa                                                    |
| `src/common/domain/value-objects/renavam.vo.spec.ts`                                              | Testes unitarios do VO de renavam                                                  |
| `src/common/filters/global-exception.filter.spec.ts`                                              | Testes unitarios do filtro global para Domain/Http/500 e normalizacao de mensagens |
| `src/common/filters/throttler-exception.filter.spec.ts`                                           | Testes unitarios do filtro de throttling                                           |
| `src/common/guards/jwt-auth.guard.spec.ts`                                                        | Testes unitarios do guard JWT e bypass `@Public()`                                 |
| `src/common/guards/throttler.guard.spec.ts`                                                       | Testes unitarios do guard de rate limiting                                         |
| `src/common/interceptors/correlation-id.interceptor.spec.ts`                                      | Testes unitarios do interceptor de correlation-id                                  |
| `src/common/interceptors/logging.interceptor.spec.ts`                                             | Testes unitarios do interceptor de logging                                         |
| `src/common/middleware/correlation-id.middleware.spec.ts`                                         | Testes unitarios do middleware de correlation-id                                   |
| `src/config/audit.config.spec.ts`                                                                 | Testes unitarios de config de auditoria                                            |
| `src/config/auth.config.spec.ts`                                                                  | Testes unitarios de config JWT                                                     |
| `src/config/cache.config.spec.ts`                                                                 | Testes unitarios de config Redis                                                   |
| `src/config/cors.config.spec.ts`                                                                  | Testes unitarios de parsing/validacao de CORS                                      |
| `src/config/database.config.spec.ts`                                                              | Testes unitarios de config TypeORM/SQL Server                                      |
| `src/config/messaging.config.spec.ts`                                                             | Testes unitarios de config RabbitMQ                                                |
| `src/config/throttle.config.spec.ts`                                                              | Testes unitarios de config de throttling                                           |
| `src/infrastructure/audit/listeners/service-audit.listener.spec.ts`                               | Testes unitarios do listener de auditoria com fail-safe                            |
| `src/infrastructure/audit/mongo-audit-logger.spec.ts`                                             | Testes unitarios do logger de auditoria Mongo                                      |
| `src/infrastructure/cache/redis-cache.service.spec.ts`                                            | Testes unitarios do adapter Redis                                                  |
| `src/infrastructure/lifecycle/graceful-shutdown.service.spec.ts`                                  | Testes unitarios de shutdown graceful                                              |
| `src/infrastructure/messaging/rabbitmq-event-publisher.spec.ts`                                   | Testes unitarios do publisher RabbitMQ (confirm/retry/DLQ)                         |
| `src/modules/auth/application/services/auth.service.spec.ts`                                      | Testes unitarios do service de login                                               |
| `src/modules/auth/infrastructure/strategies/jwt.strategy.spec.ts`                                 | Testes unitarios da estrategia JWT                                                 |
| `src/modules/auth/presentation/controllers/auth.controller.spec.ts`                               | Testes unitarios do controller de auth                                             |
| `src/modules/brands/application/services/brand.service.spec.ts`                                   | Testes unitarios dos casos de uso de marcas                                        |
| `src/modules/brands/domain/entities/brand.entity.spec.ts`                                         | Testes unitarios da entidade de dominio Brand                                      |
| `src/modules/brands/infrastructure/persistence/repositories/typeorm-brand.repository.spec.ts`     | Testes unitarios do repositorio TypeORM de marcas                                  |
| `src/modules/brands/presentation/controllers/brand.controller.spec.ts`                            | Testes unitarios do controller de marcas                                           |
| `src/modules/models/application/services/model.service.spec.ts`                                   | Testes unitarios dos casos de uso de modelos                                       |
| `src/modules/models/domain/entities/model.entity.spec.ts`                                         | Testes unitarios da entidade de dominio Model                                      |
| `src/modules/models/infrastructure/persistence/repositories/typeorm-model.repository.spec.ts`     | Testes unitarios do repositorio TypeORM de modelos                                 |
| `src/modules/models/presentation/controllers/model.controller.spec.ts`                            | Testes unitarios do controller de modelos                                          |
| `src/modules/users/application/services/user.service.spec.ts`                                     | Testes unitarios dos casos de uso de usuarios                                      |
| `src/modules/users/domain/entities/user.entity.spec.ts`                                           | Testes unitarios da entidade de dominio User                                       |
| `src/modules/users/infrastructure/persistence/repositories/typeorm-user.repository.spec.ts`       | Testes unitarios do repositorio TypeORM de usuarios                                |
| `src/modules/users/presentation/controllers/user.controller.spec.ts`                              | Testes unitarios do controller de usuarios                                         |
| `src/modules/vehicles/application/services/vehicle.service.spec.ts`                               | Testes unitarios dos casos de uso de veiculos                                      |
| `src/modules/vehicles/domain/entities/vehicle.entity.spec.ts`                                     | Testes unitarios da entidade de dominio Vehicle                                    |
| `src/modules/vehicles/infrastructure/listeners/vehicle-messaging.listener.spec.ts`                | Testes unitarios do listener de mensageria de veiculos                             |
| `src/modules/vehicles/infrastructure/persistence/repositories/typeorm-vehicle.repository.spec.ts` | Testes unitarios do repositorio TypeORM de veiculos                                |
| `src/modules/vehicles/presentation/controllers/vehicle.controller.spec.ts`                        | Testes unitarios do controller de veiculos                                         |

### Entradas adicionadas (append) — Fase 8

| Arquivo                           | Propósito                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`        | Pipeline CI para push/PR em `main` com gates de `npm ci`, `lint`, `typecheck` e `test`      |
| `aivacol-postman-collection.json` | Colecao Postman final com variaveis obrigatorias, pre-request de token e pastas por dominio |
| `src/types/autocannon.d.ts`       | Declaracoes de tipo para uso de autocannon no script de benchmark                           |

---

## Atualizacao de Ciclo

- Data: 2026-07-03
- Fase: Fase 2 — Projeto NestJS Base + Configuracao
- Acao: append de arquivos novos e preservacao do historico previo

- Data: 2026-07-03
- Fase: Fase 3 — Common / Cross-Cutting Concerns
- Acao: append de arquivos novos de filtros, interceptors, middleware, guards, decorators, health e lifecycle com preservacao do historico previo

- Data: 2026-07-03
- Fase: Fase 4 — Domain Layer
- Acao: append de arquivos novos de excecoes, value objects, entidades e portas puras de dominio com preservacao do historico previo

- Data: 2026-07-03
- Fase: Fase 5 — Infrastructure Layer (Adapters, Migrations, Seed)
- Acao: append de novos arquivos de ORM entities, mappers, repositories concretos, adapters Redis/RabbitMQ/Mongo, listeners resilientes, migrations SQL Server e seed idempotente

- Data: 2026-07-03
- Fase: Fase 6 — Application + Presentation Layer
- Acao: append de novos arquivos de services/DTOs/controllers de Auth, Vehicles, Models, Brands e Users com contratos Swagger, cache/eventos/auditoria e erros estaveis

- Data: 2026-07-03
- Fase: Fase 7 — Testes e Qualidade
- Acao: append das suites unitarias/e2e, atualizacao do esqueleto de `test/e2e` e remocao da referencia legada `test/app.e2e-spec.ts`

- Data: 2026-07-03
- Fase: Fase 8 — Documentacao, Benchmark, CI e Finalizacao
- Acao: consolidacao final com README revisado em PT-BR (checklist no inicio e benchmark oficial), ajuste de compatibilidade em `tsconfig.json`, restauracao de env padrao (`THROTTLE_LIMIT=100`) e atualizacao de rastreabilidade

- Data: 2026-07-05
- Fase: Fase 9 — QA e Performance Baseline (append)
- Acao: append de consolidacao de baseline de performance em `docs/performance-baseline-phase-9.md`, ampliacao de usabilidade da colecao Postman para reduzir passos manuais, expansao de `seed_vehicles.json`, adicao de `scripts/db.ps1` para operacao SQL assistida e ajustes de robustez em scripts (`scripts/lint.ps1` e `scripts/db.ps1`) preservando historico sem remocoes

_Consulte este arquivo ANTES de criar qualquer novo arquivo para evitar duplicações._
