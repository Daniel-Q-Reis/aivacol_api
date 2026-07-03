# struct.md — Mapa de Arquivos do Projeto

> Arquitetura adotada: backend unico em NestJS com Clean Architecture (Domain, Application, Presentation e Infrastructure), desacoplamento por portas/adapters e eventos internos.
> **Atualizado automaticamente pelas IAs executoras ao final de cada ciclo.**
> Última atualização: 2026-07-03 (Fase 4 — Domain Layer)
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
├── docs/                                        # Base documental de decisoes e runbooks
│   ├── adr/                                     # ADRs de arquitetura e trade-offs tecnicos
│   │   ├── ADR-001-clean-architecture.md
│   │   ├── ADR-002-event-driven-decoupling.md
│   │   ├── ADR-003-data-lifecycle-soft-delete-and-audit.md
│   │   └── ADR-004-sqlserver-filtered-unique-indexes-with-typeorm.md
│   └── runbooks/
│       └── infra-contingency.md
├── scripts/                                     # Automacoes PowerShell/Node para ciclo de desenvolvimento
│   ├── benchmark.ps1
│   ├── benchmark.ts
│   ├── container-healthcheck.js
│   ├── dev-container-start.js
│   ├── dev.ps1
│   ├── lint.ps1
│   ├── logs.ps1
│   ├── migrate.ps1
│   ├── placeholder-app.js
│   ├── seed.ps1
│   ├── stop.ps1
│   ├── test-e2e.ps1
│   ├── test.ps1
│   └── wait-for-deps.js
├── src/
│   ├── common/
│   │   ├── constants/
│   │   │   └── http-context.constants.ts
│   │   ├── controllers/
│   │   │   └── health.controller.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── domain/
│   │   │   ├── exceptions/
│   │   │   ├── interfaces/
│   │   │   └── value-objects/
│   │   ├── errors/
│   │   │   └── error-catalog.ts
│   │   ├── filters/
│   │   │   ├── global-exception.filter.ts
│   │   │   └── throttler-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── throttler.guard.ts
│   │   ├── interfaces/
│   │   │   └── authenticated-request.interface.ts
│   │   ├── interceptors/
│   │   │   ├── correlation-id.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   └── middleware/
│   │       └── correlation-id.middleware.ts
│   ├── config/
│   │   ├── audit.config.ts
│   │   ├── auth.config.ts
│   │   ├── cache.config.ts
│   │   ├── cors.config.ts
│   │   ├── database.config.ts
│   │   ├── messaging.config.ts
│   │   └── throttle.config.ts
│   ├── infrastructure/
│   │   ├── audit/
│   │   │   ├── listeners/
│   │   │   │   └── service-audit.listener.ts
│   │   │   ├── schemas/
│   │   │   │   └── audit-log.schema.ts
│   │   │   ├── audit.module.ts
│   │   │   └── mongo-audit-logger.ts
│   │   ├── cache/
│   │   │   ├── cache.module.ts
│   │   │   └── redis-cache.service.ts
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   │   ├── 1761900000000-CreateUsersTable.ts
│   │   │   │   ├── 1761900001000-CreateBrandsTable.ts
│   │   │   │   ├── 1761900002000-CreateModelsTable.ts
│   │   │   │   └── 1761900003000-CreateVehiclesTable.ts
│   │   │   └── seeds/
│   │   │       └── seed.ts
│   │   ├── lifecycle/
│   │   │   └── graceful-shutdown.service.ts
│   │   └── messaging/
│   │       ├── messaging.module.ts
│   │       └── rabbitmq-event-publisher.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── infrastructure/
│   │   │   │   └── strategies/
│   │   │   │       └── jwt.strategy.ts
│   │   │   └── auth.module.ts
│   │   ├── brands/
│   │   │   ├── application/mappers/brand.mapper.ts
│   │   │   ├── domain/
│   │   │   ├── infrastructure/persistence/
│   │   │   └── brands.module.ts
│   │   ├── models/
│   │   │   ├── application/mappers/model.mapper.ts
│   │   │   ├── domain/
│   │   │   ├── infrastructure/persistence/
│   │   │   └── models.module.ts
│   │   ├── users/
│   │   │   ├── application/mappers/user.mapper.ts
│   │   │   ├── domain/
│   │   │   ├── infrastructure/persistence/
│   │   │   └── users.module.ts
│   │   └── vehicles/
│   │       ├── application/mappers/vehicle.mapper.ts
│   │       ├── domain/
│   │       ├── infrastructure/
│   │       │   ├── listeners/vehicle-messaging.listener.ts
│   │       │   └── persistence/
│   │       └── vehicles.module.ts
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
│   └── app.e2e-spec.ts
├── .dockerignore
├── .eslintrc.js
├── .env.example
├── .gitignore
├── .prettierrc
├── ACHIEVEMENTS.md
├── Dockerfile
├── MASTER.md
├── README.md
├── docker-compose.yml
├── implementation_plan.md
├── jest-e2e.config.ts
├── jest.config.ts
├── nest-cli.json
├── objetivos.md
├── package-lock.json
├── package.json
├── seed_vehicles.json
├── struct.md
├── task.md
├── tsconfig.build.json
└── tsconfig.json
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
| `test/app.e2e-spec.ts`                                                   | Teste e2e inicial para rota de health                                                         |
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

_Consulte este arquivo ANTES de criar qualquer novo arquivo para evitar duplicações._
