# MASTER.md — Aivacol Fleet Management API

> **Documento-mestre do projeto.** Toda IA executora **DEVE** ler este arquivo primeiro.
> Última atualização: 2026-07-02

---

## ⚠️ PROTOCOLO DE INÍCIO DE SESSÃO (OBRIGATÓRIO)

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 1. Visão Geral

Plataforma de **Gestão de Frota** para a empresa Aivacol. Backend **pronto para produção** construído com arquitetura limpa estrita, cobrindo:

| Capacidade | Descrição |
|---|---|
| CRUD obrigatório | Vehicles, Models, Brands |
| Users | Seed, autenticação, relacionamento via `created_by` e consultas protegidas |
| Autenticação | JWT em todas as rotas |
| Cache | Redis com invalidação automática |
| Mensageria | RabbitMQ (eventos de criação/atualização de veículos) |
| Auditoria | MongoDB (todas as interações de serviço) |
| Observabilidade | Logs estruturados, Correlation IDs, Interceptor de requisições, ExceptionFilter global |
| Testes | Jest — cobertura ≥ 90% (unitários + e2e) |
| Benchmark | Autocannon — cache vs banco direto |
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

Auditoria em MongoDB é obrigatória para **todas as interações de serviço**: autenticação, consultas e mutações de Vehicles, Models, Brands e Users. A mensageria RabbitMQ permanece restrita aos eventos de veículos exigidos no desafio.

### 3.6 Estrutura de Pastas

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

---

## 4. Regras Invioláveis

| # | Regra |
|---|---|
| R1 | **Arquitetura Limpa** — Camada de domínio ZERO imports de framework |
| R2 | **Inversão de Dependência** — Services dependem APENAS de interfaces/portas |
| R3 | **Resiliência** — Falha em RabbitMQ/MongoDB NUNCA interrompe CRUD |
| R4 | **Metadados** — `created_at`, `updated_at`, `created_by` em TODAS as entidades |
| R5 | **JWT** — TODAS as rotas protegidas (exceto login e health) |
| R6 | **Cobertura** — Testes ≥ 90% (unitários + e2e) |
| R7 | **Docker** — Todo desenvolvimento via Docker Compose, ZERO instalação local extra |
| R8 | **PowerShell** — Todos os comandos compatíveis com PowerShell no Windows |
| R9 | **struct.md** — Atualizar a cada ciclo com `git status`, registrar todo arquivo criado |
| R10 | **Nenhum código sem plano** — Seguir `task.md` marcando ticks a cada etapa |

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

Sucesso:
```json
{
  "statusCode": 200,
  "message": "Vehicles retrieved successfully",
  "data": [...]
}
```

Erro:
```json
{
  "statusCode": 404,
  "message": "Vehicle not found",
  "timestamp": "2026-07-02T15:00:00.000Z",
  "path": "/api/vehicles/123",
  "correlationId": "uuid-here"
}
```

### 5.4 Variáveis de Ambiente

```env
# Application
APP_PORT=3000
NODE_ENV=development

# SQL Server
DB_HOST=sqlserver
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=Aivacol@2026!
DB_DATABASE=aivacol_fleet

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_TTL=300

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# MongoDB
MONGO_URI=mongodb://mongodb:27017/aivacol_audit

# JWT
JWT_SECRET=aivacol-jwt-secret-2026
JWT_EXPIRES_IN=1h

# Seed User
SEED_USER_NICKNAME=aivacol
SEED_USER_NAME=Aivacol Admin
SEED_USER_EMAIL=admin@aivacol.com
SEED_USER_PASSWORD=Aivacol@2026!
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

---

## 7. Decisões Arquiteturais (ADRs)

> ADRs completos serão criados no diretório `/docs/adr/` durante a implementação.

| ADR | Decisão | Justificativa |
|---|---|---|
| ADR-001 | Clean Architecture com Ports & Adapters | Desacoplamento total entre domínio e infraestrutura; facilita troca de tecnologias e testabilidade |
| ADR-002 | EventEmitter2 para desacoplamento interno | Permite que mensageria (RabbitMQ) e auditoria (MongoDB) funcionem como observers sem acoplar ao fluxo principal de CRUD |
| ADR-003 | ioredis direto (não cache-manager) | Controle fino sobre invalidação por pattern, reconnect, e operações avançadas; encapsulado atrás de `ICacheService` |

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

*Fim do MASTER.md — Este documento é a fonte da verdade do projeto.*
