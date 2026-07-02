# MASTER.md — Aivacol Fleet Management API

> **Documento-mestre do projeto.** Toda IA executora **DEVE** ler este arquivo primeiro.
> Última atualização: 2026-07-02

---

## ⚠️ PROTOCOLO DE INÍCIO DE SESSÃO (OBRIGATÓRIO)

> **Regra de negócio:** Todo ciclo de trabalho DEVE respeitar as diretrizes de qualidade definidas na Seção 12.
> Nenhum código entra no repositório sem passar por lint, typecheck e testes. O não cumprimento desqualifica o ciclo.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Execute NESTA ORDEM antes de qualquer outra ação:

  1. Leia  →  MASTER.md              (este arquivo)
  2. Leia  →  implementation_plan.md
  3. Leia  →  task.md
  4. Leia  →  struct.md              (mapa de arquivos criados)
  5. Leia  →  ACHIEVEMENTS.md        (o que foi implementado no bloco/fase atual)
  6. Execute →  git status
  7. Execute →  git log --oneline -5
  8. Revise  →  Seção 12 (Qualidade e Governança)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 1. Visão Geral

Plataforma de **Gestão de Frota** para a empresa Aivacol. Backend **pronto para produção** construído com arquitetura limpa estrita, cobrindo:

| Capacidade | Descrição |
|---|---|
| CRUD obrigatório | Vehicles, Models, Brands |
| Users | Seed, autenticação, relacionamento via `created_by` e consultas protegidas (`password_hash` técnico, não exposto) |
| Autenticação | JWT em todas as rotas de negócio (login é exceção técnica) |
| Cache | Redis com invalidação automática |
| Mensageria | RabbitMQ (eventos de criação/atualização de veículos) |
| Auditoria | MongoDB (todas as interações de serviço) |
| Observabilidade | Logs estruturados, Correlation IDs, Interceptor de requisições, ExceptionFilter global |
| Testes | Jest — cobertura ≥ 90% (unitários + e2e) |
| Benchmark | Autocannon — cache vs banco direto em runner dedicado |
| Documentação | Swagger/OpenAPI + Coleção Postman |
| CI | GitHub Actions (lint, typecheck, test) |
| Containerização | Docker multistage + Docker Compose completo |

---

## 2. Objetivos

1. **Arquitetura limpa** — inviolável e irretratável
2. **Segurança robusta** — JWT em todas as rotas
3. **Testes automatizados** — cobertura ≥ 90%
4. **Escalabilidade** — desacoplamento via eventos e interfaces
5. **Padronização da modelagem** — metadados `created_at`, `updated_at`, `created_by` em todas as entidades
6. **Observabilidade** — logs, correlation IDs, request tracing, error filter global
7. **UX do Examinador** — scripts de execução simples, README completo, checklist do desafio

---

## 2.1 Matriz de Rastreabilidade

| Requisito do `objetivos.md` | Onde será tratado | Evidência esperada |
|---|---|---|
| Clean Architecture e DIP | Fases 3, 4, 5 e 6 do `task.md` | Domínio sem imports de framework; services dependem de portas |
| CRUD Vehicles, Models e Brands | Fases 4, 5, 6 e 7 do `task.md` | Endpoints protegidos, migrations, services, testes e Swagger |
| Users e relacionamentos | Fases 4, 5, 6 e 7 do `task.md` | Seed `aivacol`, autenticação, consultas protegidas e `created_by` |
| JWT em rotas protegidas | Fases 3, 6 e 7 do `task.md` | Guard global, `@Public()` apenas em login, testes 401 |
| Redis Cache em veículos | Fases 5, 6, 7 e 8 do `task.md` | Cache hit/miss, TTL configurável, invalidação e benchmark |
| Swagger e Postman | Fases 6 e 8 do `task.md` | `/api/docs`, decorators completos e coleção JSON na raiz |
| Observabilidade e erros | Fases 3, 6 e 7 do `task.md` | Correlation ID, logs estruturados, interceptor e exception filter |
| RabbitMQ para veículos | Fases 5, 6 e 7 do `task.md` | Eventos de criação/atualização de veículos e listener resiliente |
| Auditoria MongoDB | Fases 5, 6 e 7 do `task.md` | `service-audit.listener` cobrindo interações de serviço |
| Docker e scripts PowerShell | Fases 1, 2 e 8 do `task.md` | Compose completo, Dockerfile multistage e scripts `.ps1` |
| Testes e cobertura ≥ 90% | Fase 7 do `task.md` | `npm run test:cov` com thresholds configurados |
| README, ADRs, CI e benchmark | Fase 8 do `task.md` | README com checklist/diferenciais, ADRs, CI e Autocannon |

---

## 3. Arquitetura

### 3.1 Padrão: Clean Architecture (Ports & Adapters)

```
┌─────────────────────────────────────────────────────┐
│                  PRESENTATION                       │
│   Controllers · Guards · Pipes · Interceptors       │
│   (HTTP, Swagger decorators, ValidationPipe)        │
├─────────────────────────────────────────────────────┤
│                  APPLICATION                        │
│   Use Cases / Services · DTOs · Mappers             │
│   (Orquestra lógica de negócio via portas)          │
├─────────────────────────────────────────────────────┤
│                     DOMAIN                          │
│   Entities · Value Objects · Exceptions · Ports     │
│   (TypeScript PURO — ZERO dependência de framework) │
├─────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE                      │
│   TypeORM Repos · Redis Adapter · RabbitMQ Adapter  │
│   Mongoose Audit · JWT Strategy · Config            │
│   (Implementa as portas do domínio)                 │
└─────────────────────────────────────────────────────┘
```

### 3.2 Regra de Dependência

> Dependências SEMPRE apontam para dentro (infraestrutura → domínio).
> O domínio **NUNCA** importa de `@nestjs/*`, `typeorm`, `mongoose`, `ioredis`, `amqplib`.

### 3.3 Portas do Domínio (Interfaces Obrigatórias)

| Porta | Símbolo de Injeção | Implementação |
|---|---|---|
| `IVehicleRepository` | `VEHICLE_REPOSITORY` | `TypeOrmVehicleRepository` |
| `IModelRepository` | `MODEL_REPOSITORY` | `TypeOrmModelRepository` |
| `IBrandRepository` | `BRAND_REPOSITORY` | `TypeOrmBrandRepository` |
| `IUserRepository` | `USER_REPOSITORY` | `TypeOrmUserRepository` |
| `ICacheService` | `CACHE_SERVICE` | `RedisCacheService` |
| `IEventPublisher` | `EVENT_PUBLISHER` | `RabbitMqEventPublisher` |
| `IAuditLogger` | `AUDIT_LOGGER` | `MongoAuditLogger` |

### 3.4 Estratégia de Eventos e Resiliência

```
Service (Application Layer)
    │
    ├─── CRUD no SQL Server (operação principal — NUNCA falha por causa de evento)
    ├─── eventEmitter.emit('audit.service_interaction', payload)   ← fire-and-forget
    │
    └─── eventEmitter.emit('vehicle.created', payload)             ← fire-and-forget
              │
              ├──→ AuditListener  → try { MongoDB.insert() } catch { logger.error() }
              │
              └──→ MessagingListener → try { RabbitMQ.publish() } catch { logger.error() }
```

> **Regra inviolável:** Se RabbitMQ ou MongoDB caírem, as operações de CRUD no SQL Server **NÃO PODEM** ser interrompidas. Listeners **NUNCA** relançam exceções.

### 3.5 Escopo de Auditoria

Auditoria em MongoDB é obrigatória para **todas as interações de serviço**:

- `AUTH` (autenticação)
- `READ` (consultas)
- `MUTATION` (operações de escrita)

A mensageria RabbitMQ permanece restrita aos eventos de veículos exigidos no desafio.

### 3.6 Versionamento e Paginação

- Todas as rotas HTTP seguirão prefixo versionado: `/api/v1`.
- Endpoints de listagem usarão paginação explícita (`page`, `limit`, `sort`, `order`) com limites defensivos.
- Swagger deve documentar parâmetros de paginação e seus defaults.

Política final de autenticação e Swagger:

- Única rota pública da API: `POST /api/v1/auth/login`.
- Todas as rotas de `/api/v1/**` exigem JWT e devem retornar `401` sem token válido.
- O Swagger permanece exposto em `/api/docs` para avaliação, com esquema Bearer configurado.
- No Swagger, a execução dos endpoints da API requer token Bearer; sem token, o retorno esperado é `401` nas rotas protegidas.

### 3.7 Estrutura de Pastas

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── database.config.ts
│   ├── cache.config.ts
│   ├── messaging.config.ts
│   ├── audit.config.ts
│   └── auth.config.ts
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── global-exception.filter.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── correlation-id.interceptor.ts
│   ├── middleware/
│   │   └── correlation-id.middleware.ts
│   └── pipes/
├── modules/
│   ├── vehicles/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── vehicle.entity.ts
│   │   │   ├── interfaces/
│   │   │   │   └── vehicle-repository.interface.ts
│   │   │   └── exceptions/
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   └── vehicle.service.ts
│   │   │   ├── dtos/
│   │   │   │   ├── create-vehicle.dto.ts
│   │   │   │   └── update-vehicle.dto.ts
│   │   │   └── mappers/
│   │   │       └── vehicle.mapper.ts
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   │   ├── entities/
│   │   │   │   │   └── vehicle.orm-entity.ts
│   │   │   │   └── repositories/
│   │   │   │       └── typeorm-vehicle.repository.ts
│   │   │   └── listeners/
│   │   │       └── vehicle-messaging.listener.ts
│   │   ├── presentation/
│   │   │   └── controllers/
│   │   │       └── vehicle.controller.ts
│   │   └── vehicles.module.ts
│   ├── models/          (mesma estrutura)
│   ├── brands/          (mesma estrutura)
│   ├── users/           (consulta/autenticação/relacionamento via created_by)
│   └── auth/
│       ├── application/
│       │   ├── services/
│       │   │   └── auth.service.ts
│       │   └── dtos/
│       │       └── login.dto.ts
│       ├── infrastructure/
│       │   └── strategies/
│       │       └── jwt.strategy.ts
│       ├── presentation/
│       │   └── controllers/
│       │       └── auth.controller.ts
│       └── auth.module.ts
├── infrastructure/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   │       └── seed.ts
│   ├── cache/
│   │   └── redis-cache.service.ts
│   ├── messaging/
│   │   └── rabbitmq-event-publisher.ts
│   └── audit/
│       ├── listeners/
│       │   └── service-audit.listener.ts
│       ├── schemas/
│       │   └── audit-log.schema.ts
│       └── mongo-audit-logger.ts
└── test/
    ├── unit/
    └── e2e/
```

### 3.8 Estratégia de Produção para Mensageria

- Publicação RabbitMQ com confirmação de entrega (`publisher confirms`) e roteamento obrigatório.
- Retry com backoff exponencial para falhas transitórias.
- Dead Letter Queue (DLQ) para mensagens inválidas ou sem processamento após limite de tentativas.
- Idempotência no consumidor com `eventId` e deduplicação por janela temporal.
- Falha de mensageria nunca interrompe a transação principal de CRUD.

### 3.9 Estratégia de Produção para Dados

- Soft delete no SQL Server com `deleted_at`.
- Unicidade de negócio aplicada somente para registros ativos.
- Em SQL Server, usar índice único filtrado (ex.: `WHERE deleted_at IS NULL`) para `license_plate`, `chassis` e `renavam`.
- Regra documentada em migration e validada por testes de integração.

---

## 4. Regras Invioláveis

| # | Regra |
|---|---|
| R1 | **Arquitetura Limpa** — Camada de domínio ZERO imports de framework |
| R2 | **Inversão de Dependência** — Services dependem APENAS de interfaces/portas |
| R3 | **Resiliência** — Falha em RabbitMQ/MongoDB NUNCA interrompe CRUD |
| R4 | **Metadados** — `created_at`, `updated_at`, `created_by` em TODAS as entidades |
| R5 | **JWT** — Todas as rotas de `/api/v1/**` protegidas (única exceção: `POST /api/v1/auth/login`) |
| R6 | **Cobertura** — Testes ≥ 90% (unitários + e2e) |
| R7 | **Docker** — Todo desenvolvimento via Docker Compose, ZERO instalação local extra |
| R8 | **PowerShell** — Todos os comandos compatíveis com PowerShell no Windows |
| R9 | **struct.md** — Atualizar a cada ciclo com `git status`, registrar todo arquivo criado |
| R10 | **Nenhum código sem plano** — Seguir `task.md` marcando ticks a cada etapa |
| R11 | **Value Objects obrigatórios** — Placa, chassi e renavam devem ser VOs no domínio |
| R12 | **Mensageria production-first** — Confirm, retry, DLQ e idempotência desde a primeira versão |
| R13 | **Unicidade com soft delete** — Constraints devem considerar apenas registros ativos |
| R14 | **Qualidade como gate** — Nenhum ciclo é válido sem lint, typecheck e testes passando (Seção 12) |
| R15 | **Política de idioma** — Código interno em inglês; mensagens de erro retornadas ao usuário final em PT-BR |
| R16 | **Config fail-fast** — Variáveis obrigatórias devem ser validadas no startup; ausência/inconsistência deve bloquear bootstrap |
| R17 | **Sem magic numbers/strings de domínio** — Regras e constantes de negócio devem ser centralizadas e nomeadas |
| R18 | **Catálogo de erros versionável** — Todo erro de API deve ter `code` único, estável e rastreável |

---

## 5. Convenções

### 5.1 Nomenclatura

| Elemento | Convenção | Exemplo |
|---|---|---|
| Arquivos | kebab-case | `vehicle.service.ts` |
| Classes | PascalCase | `VehicleService` |
| Interfaces | `I` + PascalCase | `IVehicleRepository` |
| Tokens de Injeção | UPPER_SNAKE_CASE (Symbol) | `VEHICLE_REPOSITORY` |
| ORM Entities | PascalCase + sufixo `OrmEntity` | `VehicleOrmEntity` |
| Domain Entities | PascalCase (sem sufixo) | `Vehicle` |
| DTOs | PascalCase + sufixo `Dto` | `CreateVehicleDto` |
| Tabelas | snake_case plural | `vehicles`, `models`, `brands` |
| Colunas | snake_case | `license_plate`, `created_at` |
| Migrations | Timestamp + descrição | `1719920000000-CreateVehiclesTable` |

### 5.2 Commits

```
feat: add vehicle CRUD endpoints
fix: correct cache invalidation on vehicle update
test: add unit tests for VehicleService
chore: configure Docker Compose
docs: update README with checklist
```

### 5.3 Respostas HTTP Padronizadas

Política aplicada a contratos HTTP:

- Campos estruturais e códigos internos devem ser estáveis e em inglês (`code`, nomes de campos, identificadores técnicos).
- Mensagens retornadas ao usuário final devem estar em PT-BR quando exibirem erro de negócio/validação.
- Logs técnicos, stack traces e mensagens internas de observabilidade permanecem em inglês.

Sucesso:
```json
{
  "statusCode": 200,
  "code": "VEHICLES_LISTED",
  "message": "Veículos listados com sucesso",
  "data": [...]
}
```

Erro:
```json
{
  "statusCode": 404,
  "code": "VEHICLE_NOT_FOUND",
  "message": "Veículo não encontrado",
  "timestamp": "2026-07-02T15:00:00.000Z",
  "path": "/api/v1/vehicles/123",
  "correlationId": "uuid-here"
}
```

### 5.5 Política de Idioma (Código x Usuário Final)

| Contexto | Regra obrigatória |
|---|---|
| Código-fonte (classes, funções, variáveis, arquivos) | Inglês |
| Comentários técnicos no código | Inglês |
| Testes (nomes de suites/cases) | Inglês |
| Logs técnicos e observabilidade | Inglês |
| Mensagens de erro para cliente API (frontend/consumidor) | PT-BR |
| Códigos de erro (`code`) | Inglês, estável e versionável |

Guardrails:

- Não hardcodar mensagens de erro em múltiplos pontos; centralizar catálogo de erros PT-BR por `error code`.
- Testes de API devem validar `statusCode` + `code`; validar `message` PT-BR apenas nos cenários críticos de contrato.
- Exceptions de domínio podem carregar `code` em inglês, e a tradução para PT-BR deve ocorrer na borda HTTP (filter/mapper).

### 5.6 Configuração, Constantes e Erros

| Tema | Regra obrigatória |
|---|---|
| Configuração (`.env`) | Validar schema no startup (ex.: porta, secrets, credenciais e hosts obrigatórios) |
| Fail-fast | Se configuração crítica estiver inválida/ausente, a aplicação deve encerrar com log claro |
| Constantes de negócio | Centralizar em módulos/VOs dedicados; evitar literais repetidos em services/controllers |
| Erros de API | Usar catálogo versionável com `code` único por caso de erro |
| Estabilidade de contrato | `code` não deve mudar sem justificativa e versão/documentação |

### 5.4 Variáveis de Ambiente

```env
# Application
APP_PORT=3000
NODE_ENV=development

# SQL Server
DB_HOST=sqlserver
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=<CHANGE_ME_DB_PASSWORD>
DB_DATABASE=aivacol_fleet

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_TTL=300

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=<CHANGE_ME_RABBITMQ_USER>
RABBITMQ_PASS=<CHANGE_ME_RABBITMQ_PASSWORD>

# MongoDB
MONGO_URI=mongodb://mongodb:27017/aivacol_audit

# JWT
JWT_SECRET=<CHANGE_ME_JWT_SECRET>
JWT_EXPIRES_IN=1h

# Seed User
SEED_USER_NICKNAME=aivacol
SEED_USER_NAME=Aivacol Admin
SEED_USER_EMAIL=admin@aivacol.com
SEED_USER_PASSWORD=<CHANGE_ME_SEED_USER_PASSWORD>
```

---

## 6. Tecnologias

| Tecnologia | Versão | Propósito |
|---|---|---|
| Node.js | 18+ (LTS) | Runtime |
| NestJS | 10+ | Framework principal |
| TypeScript | 5.x | Linguagem |
| TypeORM | 0.3.x | ORM + Migrations |
| mssql (tedious) | — | Driver SQL Server |
| SQL Server 2022 | — | Banco relacional principal |
| Redis 7 | — | Cache |
| ioredis | — | Cliente Redis |
| RabbitMQ 3 | — | Mensageria |
| @golevelup/nestjs-rabbitmq | — | Integração RabbitMQ |
| @nestjs/event-emitter | — | Eventos internos (desacoplamento) |
| MongoDB 7 | — | Auditoria |
| @nestjs/mongoose + mongoose | — | ODM para MongoDB |
| @nestjs/passport + passport-jwt | — | Autenticação JWT |
| @nestjs/swagger | — | Documentação OpenAPI |
| Jest | — | Testes |
| Autocannon | — | Benchmark de performance |
| ESLint + Prettier | — | Linting e formatação |
| Docker + Docker Compose | — | Containerização |
| GitHub Actions | — | CI |

### 6.1 Política de Versionamento

- Dependências diretas do `package.json` devem usar versões fixas (sem `^` e sem `~`) para garantir reprodutibilidade entre sessões de IA.
- `package-lock.json` deve permanecer versionado e atualizado a cada alteração de dependência.
- Atualizações de versão devem ser feitas em PR dedicado com validação completa (`lint`, `typecheck`, `test`, `test:e2e`).

### 6.2 Trade-off de Mensageria

- Escolha atual: `@golevelup/nestjs-rabbitmq` para melhor suporte prático a `publisher confirms`, configuração de DLQ e integração orientada a publicação.
- Alternativa considerada: `@nestjs/microservices` (oficial Nest), com maior padronização, porém com menor ergonomia para os requisitos específicos de publicação resiliente definidos neste projeto.
- A decisão e seus trade-offs devem permanecer rastreados em ADR e no README.

---

## 7. Decisões Arquiteturais (ADRs)

> ADRs base já foram criados no diretório `/docs/adr/` e podem ser refinados durante a implementação.

| ADR | Decisão | Justificativa |
|---|---|---|
| ADR-001 | Clean Architecture com Ports & Adapters | Desacoplamento total entre domínio e infraestrutura; facilita troca de tecnologias e testabilidade |
| ADR-002 | EventEmitter2 para desacoplamento interno | Permite que mensageria (RabbitMQ) e auditoria (MongoDB) funcionem como observers sem acoplar ao fluxo principal de CRUD |
| ADR-003 | Ciclo de vida de dados com soft delete + auditoria | Preserva histórico no banco relacional para compliance e operação, com trilha complementar no MongoDB |

### 7.1 Diretriz de Implementação Crítica

- Campos de negócio únicos (`license_plate`, `chassis`, `renavam`) devem funcionar com reutilização após soft delete.
- A migration deve criar índices únicos filtrados para registros ativos.
- O plano de testes deve incluir cenários de criação, soft delete e recriação com a mesma chave de negócio.

---

## 8. Ordem de Prioridade

Em caso de conflito entre instruções, prevalece esta ordem:

| Prioridade | Aspecto |
|---|---|
| 1 🔴 | Arquitetura limpa |
| 2 🟠 | Correção funcional |
| 3 🟡 | Testes automatizados |
| 4 🔵 | Segurança |
| 5 🟢 | Escalabilidade |
| 6 ⚪ | Observabilidade |
| 7 ⚫ | Performance |
| 8 📝 | Documentação |

---

## 9. Restrições

| Restrição | Detalhe |
|---|---|
| **OS** | Windows 11 |
| **Shell** | PowerShell 7.5+ (validado em 7.6.3) |
| **Editor** | Visual Studio Code |
| **Containerização** | Docker Desktop (já instalado) |
| **Git** | Já instalado com GitHub CLI configurado |
| **Instalação local** | NENHUMA além de Docker Desktop, Git, PowerShell, VS Code |
| **Desenvolvimento** | TODO via Docker Compose |
| **Bash** | Proibido em host; permitido APENAS dentro de containers |
| **Comandos** | Sempre multiplataforma; compatíveis com PowerShell |

---

## 10. Regra do struct.md

> **REGRA INVIOLÁVEL**: Ao final de CADA ciclo de trabalho, a IA executora DEVE:

1. Executar `git status`
2. Para cada arquivo **criado** (new file), adicioná-lo ao `struct.md` com:
   - Caminho completo relativo à raiz
   - Breve explicação do propósito do arquivo
3. Para cada arquivo **deletado**, removê-lo do `struct.md`
4. Nunca criar arquivos duplicados — consultar `struct.md` antes de criar

Formato do `struct.md`:
```markdown
# struct.md — Mapa de Arquivos do Projeto

> Atualizado automaticamente pelas IAs executoras.

| Arquivo | Propósito |
|---|---|
| `src/main.ts` | Bootstrap da aplicação NestJS |
| `src/modules/vehicles/domain/entities/vehicle.entity.ts` | Entidade de domínio Vehicle |
| ... | ... |
```

---

## 11. Regra do ACHIEVEMENTS.md

Ao final de cada bloco/fase de implementação, a IA executora DEVE atualizar o `ACHIEVEMENTS.md` com:

- O que foi implementado naquele bloco
- Testes que passaram
- Problemas encontrados e resolvidos
- Próximos passos

---

## 12. Qualidade e Governança

> Diretrizes obrigatórias para todo ciclo de implementação.
> A não observância de qualquer item abaixo desqualifica o ciclo e impede o commit.

### 12.1 Gates Obrigatórios por Ciclo

| Gate | Comando | Exigência |
|------|---------|-----------|
| Lint | `npm run lint` | Zero erros |
| Lint Fix | `npm run lint:fix` | Zero erros residuais |
| Typecheck | `npm run typecheck` | Zero erros de tipo |
| Testes unitários | `npm run test` | 100% passando |
| Cobertura | `npm run test:cov` | ≥ 90% (lines, functions, statements) |
| Testes E2E | `npm run test:e2e` | 100% passando |

> Os comandos acima devem ser executados dentro do container Docker via scripts PowerShell em `scripts/`.

### 12.2 Justificativa

| Prática | Por que é obrigatória |
|---------|----------------------|
| **Lint + typecheck como gate** | Elimina revisão humana de estilo e erros óbvios. Review foca 100% em lógica e arquitetura. |
| **Cobertura ≥ 90%** | Garante que regras de negócio, serviços e validações estão protegidos contra regressão. |
| **Achievements.md** | Rastreia o que foi feito em cada ciclo — essencial quando IAs executoras trabalham em múltiplas sessões sem contexto compartilhado. |
| **Benchmark (Autocannon)** | Detecta regressão silenciosa de performance no cache Redis vs. banco direto. |
| **CI (GitHub Actions)** | Automatiza os gates em todo push/PR para main. Previne que código fora do padrão seja mergeado. |
| **Política de idioma** | Mantém consistência global para manutenção técnica (inglês) e experiência do usuário final (PT-BR nos erros). |
| **Config fail-fast** | Evita ambientes quebrados “parecendo saudáveis” e reduz falhas tardias em runtime. |
| **Constantes centralizadas** | Reduz divergência de regra de negócio e minimiza regressão por literals duplicados. |
| **Catálogo de erros** | Padroniza integração com frontend e facilita troubleshooting por `error code`. |

### 12.3 Benchmark de Performance

O script `scripts/benchmark.ps1` executa Autocannon em runner Docker dedicado:

1. `GET /api/v1/vehicles` com cache **quente** (Redis populado)
2. `GET /api/v1/vehicles` com cache **frio** (Redis limpo)

O output deve ser registrado no `ACHIEVEMENTS.md` da fase para evidenciar a eficiência do cache. Qualquer degradação superior a 30% no throughput em relação à execução anterior deve disparar investigação.

### 12.4 Pipeline de CI

```yaml
# .github/workflows/ci.yml
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

### 12.5 Responsabilidade do Ciclo

A IA executora DEVE:

1. Executar lint + lint:fix + typecheck **antes** de qualquer commit
2. Executar testes **antes** de marcar qualquer fase como concluída
3. Registrar evidências (saída de comandos, coverage report) no `ACHIEVEMENTS.md`
4. Se qualquer gate falhar, **parar** e corrigir antes de prosseguir
5. Atualizar `struct.md` com arquivos criados/deletados
6. Validar política de idioma: código/comentários/logs em inglês e mensagens de erro de API em PT-BR
7. Validar configuração obrigatória no startup (fail-fast) antes de considerar fase concluída
8. Evitar literals de domínio repetidos; centralizar constantes e registrar decisão quando necessário
9. Garantir `error code` único e estável para novos erros expostos pela API

> **Regra de ouro:** Um ciclo sem qualidade não é um ciclo completo. É dívida técnica.

---

*Fim do MASTER.md — Este documento é a fonte da verdade do projeto.*
