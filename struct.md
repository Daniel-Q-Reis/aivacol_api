# struct.md — Mapa de Arquivos do Projeto

> Arquitetura adotada: backend unico em NestJS com Clean Architecture (Domain, Application, Presentation e Infrastructure), desacoplamento por portas/adapters e eventos internos.
> **Atualizado automaticamente pelas IAs executoras ao final de cada ciclo.**
> Última atualização: 2026-07-03 (Fase 3 — Common / Cross-Cutting Concerns)
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
│   │   ├── ADR-001-clean-architecture.md        # Decisao de Clean Architecture com ports/adapters
│   │   ├── ADR-002-event-driven-decoupling.md   # Decisao de desacoplamento interno via eventos
│   │   ├── ADR-003-data-lifecycle-soft-delete-and-audit.md # Ciclo de vida de dados e auditoria
│   │   └── ADR-004-sqlserver-filtered-unique-indexes-with-typeorm.md # Indices filtrados no SQL Server
│   └── runbooks/                                # Guias operacionais para suporte/contingencia
│       └── infra-contingency.md                 # Runbook para falhas de infraestrutura local
├── src/                                         # Codigo-fonte da aplicacao NestJS
│   ├── config/                                  # Factories de configuracao por dominio tecnico
│   │   ├── audit.config.ts                      # Configuracao fail-fast de auditoria MongoDB
│   │   ├── auth.config.ts                       # Configuracao fail-fast de autenticacao JWT
│   │   ├── cache.config.ts                      # Configuracao fail-fast de cache Redis
│   │   ├── cors.config.ts                       # Parse e validacao de allowlist CORS
│   │   ├── database.config.ts                   # Configuracao TypeORM/SQL Server + DataSource
│   │   ├── messaging.config.ts                  # Configuracao fail-fast de RabbitMQ
│   │   └── throttle.config.ts                   # Configuracao fail-fast de throttling
│   ├── modules/                                 # Modulos de feature (placeholders da Fase 2)
│   │   ├── auth/
│   │   │   └── auth.module.ts                   # Placeholder do modulo Auth
│   │   ├── brands/
│   │   │   └── brands.module.ts                 # Placeholder do modulo Brands
│   │   ├── models/
│   │   │   └── models.module.ts                 # Placeholder do modulo Models
│   │   ├── users/
│   │   │   └── users.module.ts                  # Placeholder do modulo Users
│   │   └── vehicles/
│   │       └── vehicles.module.ts               # Placeholder do modulo Vehicles
│   ├── app.controller.spec.ts                   # Teste unitario inicial do controller
│   ├── app.controller.ts                        # Endpoint basico de health
│   ├── app.module.ts                            # Modulo raiz com imports globais e infraestrutura base
│   ├── app.service.ts                           # Service basico de health
│   └── main.ts                                  # Bootstrap NestJS (pipes, Swagger, CORS, prefixo, shutdown)
├── test/                                        # Testes end-to-end
│   └── app.e2e-spec.ts                          # Teste e2e inicial da rota de health
├── scripts/                                     # Automacoes PowerShell/Node para ciclo de desenvolvimento
│   ├── benchmark.ps1                            # Executa benchmark no runner dedicado (profile tools)
│   ├── benchmark.ts                             # Script de carga (cache quente/frio) para Autocannon
│   ├── container-healthcheck.js                 # Healthcheck HTTP do container da app
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
├── .dockerignore                                # Exclusoes de contexto de build Docker
├── .eslintrc.js                                 # Configuracao ESLint com TypeScript + Prettier
├── .env.example                                 # Template de variaveis sem segredos
├── .gitignore                                   # Regras de exclusao de artefatos locais
├── .prettierrc                                  # Regras de formatacao Prettier
├── ACHIEVEMENTS.md                              # Registro de entregas e evidencias por fase
├── Dockerfile                                   # Build multistage para desenvolvimento e producao
├── MASTER.md                                    # Fonte de verdade de arquitetura, regras e governanca
├── README.md                                    # Guia geral do projeto
├── docker-compose.yml                           # Orquestracao de servicos da stack local
├── implementation_plan.md                       # Plano macro de implementacao por fases
├── jest-e2e.config.ts                           # Configuracao Jest para testes e2e
├── jest.config.ts                               # Configuracao Jest para testes unitarios/cobertura
├── nest-cli.json                                # Configuracao do Nest CLI com plugin Swagger
├── objetivos.md                                 # Requisitos originais do desafio
├── package-lock.json                            # Lockfile npm para reproducibilidade de dependencias
├── package.json                                 # Manifesto npm com scripts e dependencias fixas
├── struct.md                                    # Mapa de arquivos + esqueleto de navegacao humano
├── task.md                                      # Checklist de execucao por fase
├── tsconfig.build.json                          # Configuracao TypeScript para build
└── tsconfig.json                                # Configuracao TypeScript strict com aliases
```

---

## Arquivos do Projeto

| Arquivo                                                              | Propósito                                                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `objetivos.md`                                                       | Documento original do desafio (requisitos completos)                                          |
| `MASTER.md`                                                          | Documento-mestre: visão geral, arquitetura, regras, convenções, tecnologias                   |
| `implementation_plan.md`                                             | Plano de implementação detalhado em 8 fases                                                   |
| `task.md`                                                            | Checklist granular de tarefas para tracking de progresso                                      |
| `struct.md`                                                          | Este arquivo — mapa de arquivos do projeto (fonte de verdade)                                 |
| `ACHIEVEMENTS.md`                                                    | Registro do que foi implementado em cada fase/bloco                                           |
| `README.md`                                                          | Documentacao inicial do projeto com checklist e diferenciais                                  |
| `.gitignore`                                                         | Regras de exclusao de arquivos locais/temporarios do Git                                      |
| `docs/adr/ADR-001-clean-architecture.md`                             | ADR da decisao de arquitetura limpa com ports and adapters                                    |
| `docs/adr/ADR-002-event-driven-decoupling.md`                        | ADR da estrategia de desacoplamento interno com eventos                                       |
| `docs/adr/ADR-003-data-lifecycle-soft-delete-and-audit.md`           | ADR da estrategia de soft delete e auditoria complementar                                     |
| `docs/adr/ADR-004-sqlserver-filtered-unique-indexes-with-typeorm.md` | ADR da decisao de usar SQL raw em migrations para indices filtrados no SQL Server             |
| `docs/runbooks/infra-contingency.md`                                 | Runbook de contingencia para falhas de infraestrutura e recuperacao operacional               |
| `docker-compose.yml`                                                 | Orquestracao Docker da Fase 1 com app, sqlserver, redis, rabbitmq, mongodb e benchmark-runner |
| `Dockerfile`                                                         | Build multistage (dev, builder, production) com usuario nao-root e healthcheck no stage final |
| `.dockerignore`                                                      | Exclusoes de contexto de build Docker para reduzir ruido e tempo de build                     |
| `.env`                                                               | Variaveis locais de ambiente para desenvolvimento via Docker Compose (arquivo nao versionado) |
| `.env.example`                                                       | Template de variaveis de ambiente sem segredos para onboarding/reproducao                     |
| `scripts/dev.ps1`                                                    | Sobe a stack com build e mostra status dos servicos                                           |
| `scripts/stop.ps1`                                                   | Desliga containers e remove orfaos da stack local                                             |
| `scripts/logs.ps1`                                                   | Stream de logs por servico via Docker Compose                                                 |
| `scripts/test.ps1`                                                   | Executa cobertura de testes no container app (com fallback N/A na Fase 1)                     |
| `scripts/test-e2e.ps1`                                               | Executa testes E2E no container app (com fallback N/A na Fase 1)                              |
| `scripts/lint.ps1`                                                   | Executa lint, lint:fix e typecheck no container app (com fallback N/A na Fase 1)              |
| `scripts/migrate.ps1`                                                | Executa migrations via container app (com fallback N/A na Fase 1)                             |
| `scripts/seed.ps1`                                                   | Executa seed via container app (com fallback N/A na Fase 1)                                   |
| `scripts/benchmark.ps1`                                              | Entrada oficial de benchmark com `docker compose --profile tools run --rm benchmark-runner`   |
| `scripts/benchmark.ts`                                               | Cenarios de benchmark (cache quente/frio) com base padrao `http://app:3000`                   |
| `scripts/wait-for-deps.js`                                           | Espera ativa de dependencias TCP antes do bootstrap da app                                    |
| `scripts/dev-container-start.js`                                     | Orquestra boot da app no container (wait-for-deps + fallback ate Fase 2)                      |
| `scripts/placeholder-app.js`                                         | Servidor placeholder para manter app healthy durante a Fase 1                                 |
| `scripts/container-healthcheck.js`                                   | Healthcheck HTTP interno usado no compose e no stage production                               |
| `.agents/`                                                           | Artefato gerado automaticamente por ferramentas CLI; sem impacto funcional na aplicacao       |
| `package.json`                                                       | Manifesto do projeto NestJS com scripts de qualidade, testes, migracoes, seed e benchmark     |
| `package-lock.json`                                                  | Lockfile npm com arvore de dependencias fixada para reproducibilidade                         |
| `.eslintrc.js`                                                       | Configuracao ESLint com TypeScript e integracao Prettier                                      |
| `.prettierrc`                                                        | Regras de formatacao Prettier (singleQuote, trailingComma, printWidth)                        |
| `nest-cli.json`                                                      | Configuracao do Nest CLI com plugin Swagger habilitado                                        |
| `tsconfig.json`                                                      | Configuracao TypeScript strict com aliases de path                                            |
| `tsconfig.build.json`                                                | Configuracao TypeScript para build de producao                                                |
| `jest.config.ts`                                                     | Configuracao de testes unitarios com thresholds globais de cobertura                          |
| `jest-e2e.config.ts`                                                 | Configuracao dedicada para testes e2e                                                         |
| `src/main.ts`                                                        | Bootstrap da aplicacao com ValidationPipe global, CORS allowlist, Swagger e prefixo `/api/v1` |
| `src/app.module.ts`                                                  | Modulo raiz com ConfigModule global, TypeORM async, Mongoose async e EventEmitter             |
| `src/app.controller.ts`                                              | Controller basico de health em `/api/v1/health`                                               |
| `src/app.service.ts`                                                 | Service basico de health retornando status operacional                                        |
| `src/app.controller.spec.ts`                                         | Teste unitario inicial do endpoint de health                                                  |
| `test/app.e2e-spec.ts`                                               | Teste e2e inicial para rota de health                                                         |
| `src/config/database.config.ts`                                      | Factory de configuracao do TypeORM/SQL Server com pool e timeout por env                      |
| `src/config/cache.config.ts`                                         | Factory de configuracao Redis (host, port, ttl)                                               |
| `src/config/messaging.config.ts`                                     | Factory de configuracao RabbitMQ e URI AMQP                                                   |
| `src/config/audit.config.ts`                                         | Factory de configuracao de auditoria MongoDB                                                  |
| `src/config/auth.config.ts`                                          | Factory de configuracao JWT (secret e expiresIn)                                              |
| `src/config/cors.config.ts`                                          | Parse e validacao fail-fast da allowlist CORS por `CORS_ORIGINS`                              |
| `src/config/throttle.config.ts`                                      | Parse e validacao fail-fast de throttling global                                              |
| `src/modules/vehicles/vehicles.module.ts`                            | Placeholder do modulo de feature Vehicles para wiring futuro                                  |
| `src/modules/models/models.module.ts`                                | Placeholder do modulo de feature Models para wiring futuro                                    |
| `src/modules/brands/brands.module.ts`                                | Placeholder do modulo de feature Brands para wiring futuro                                    |
| `src/modules/users/users.module.ts`                                  | Placeholder do modulo de feature Users para wiring futuro                                     |
| `src/modules/auth/auth.module.ts`                                    | Placeholder do modulo de feature Auth para wiring futuro                                      |
| `src/common/constants/http-context.constants.ts`                     | Constantes centralizadas de contexto HTTP (correlation-id e metadata de rota publica)         |
| `src/common/interfaces/authenticated-request.interface.ts`           | Contratos tipados para request autenticada e payload JWT no contexto HTTP                     |
| `src/common/decorators/public.decorator.ts`                          | Decorator `@Public()` para marcar endpoints que devem ignorar autenticacao global             |
| `src/common/decorators/current-user.decorator.ts`                    | Decorator `@CurrentUser()` para extrair usuario/payload JWT do request                        |
| `src/common/middleware/correlation-id.middleware.ts`                 | Middleware de captura precoce e propagacao de correlation ID                                  |
| `src/common/interceptors/correlation-id.interceptor.ts`              | Interceptor para garantir correlation ID no ciclo HTTP e no header de resposta                |
| `src/common/interceptors/logging.interceptor.ts`                     | Interceptor global de logs de request/response com metodo, rota, status, tempo e userId       |
| `src/common/filters/global-exception.filter.ts`                      | Filtro global para padronizar erros HTTP/Domain/500 com correlation ID                        |
| `src/common/filters/throttler-exception.filter.ts`                   | Filtro dedicado para padronizar resposta 429 com `RATE_LIMIT_EXCEEDED`                        |
| `src/common/guards/jwt-auth.guard.ts`                                | Guard JWT global com bypass por `@Public()`                                                   |
| `src/common/guards/throttler.guard.ts`                               | Guard global de rate limit baseado em `@nestjs/throttler`                                     |
| `src/common/controllers/health.controller.ts`                        | Endpoint protegido `/api/v1/health` com verificacao de conectores de infraestrutura           |
| `src/common/errors/error-catalog.ts`                                 | Catalogo inicial de erros estaveis com status HTTP e mensagem PT-BR                           |
| `src/common/domain/exceptions/domain.exception.ts`                   | Excecao base de dominio com `code` e `statusCode` para contrato HTTP padronizado              |
| `src/modules/auth/infrastructure/strategies/jwt.strategy.ts`         | Estrategia JWT do Passport para validar bearer token e normalizar payload do usuario          |
| `src/infrastructure/lifecycle/graceful-shutdown.service.ts`          | Service de shutdown graceful para fechar conexoes externas sem derrubar o bootstrap           |

---

## Atualizacao de Ciclo

- Data: 2026-07-03
- Fase: Fase 2 — Projeto NestJS Base + Configuracao
- Acao: append de arquivos novos e preservacao do historico previo

- Data: 2026-07-03
- Fase: Fase 3 — Common / Cross-Cutting Concerns
- Acao: append de arquivos novos de filtros, interceptors, middleware, guards, decorators, health e lifecycle com preservacao do historico previo

_Consulte este arquivo ANTES de criar qualquer novo arquivo para evitar duplicações._
