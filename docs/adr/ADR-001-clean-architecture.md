# ADR-001: Clean Architecture com Ports and Adapters

## Status

Aprovado

## Contexto

O desafio exige arquitetura limpa estrita, desacoplamento entre dominio e infraestrutura, alto nivel de testabilidade e manutencao simples para evolucao.

## Decisao

Adotar Clean Architecture com separacao explicita entre camadas:

- Domain: entidades, excecoes e portas (interfaces)
- Application: casos de uso, DTOs e orquestracao
- Presentation: controllers, guards e contratos HTTP
- Infrastructure: TypeORM, Redis, RabbitMQ, MongoDB e adapters

As dependencias apontam para dentro. O dominio nao importa framework.

## Consequencias Positivas

- Alta testabilidade dos casos de uso com mocks de portas
- Troca de tecnologia com impacto controlado
- Menor acoplamento e melhor manutencao de longo prazo
- Melhor legibilidade de responsabilidades por camada

## Drawbacks

- Mais arquivos e mais boilerplate inicial
- Curva de aprendizado maior para time sem experiencia no padrao
- Maior disciplina de revisao para evitar vazamento de infraestrutura

## Alternativas Consideradas

### Alternativa A — Arquitetura em camadas tradicional com repositorios acoplados ao framework
Rejeitada por menor isolamento do dominio e pior testabilidade.

### Alternativa B — Estrutura por modulo sem portas explicitas
Rejeitada por menor isolamento do dominio e pior testabilidade.

### Alternativa C — Monorepo com API e Worker separados (npm workspaces)

Estrutura considerada antes da decisao final:

```
aivacol-fleet-backend/
│
├── package.json                  # Raiz do monorepo – npm workspaces (api, worker, common)
├── docker-compose.yml            # SQL Server, Redis, RabbitMQ, MongoDB, api, worker
├── .env.example
├── README.md                     # Documentação completa (badges, Mermaid, justificativas)
├── aivacol.postman_collection.json
├── IMPLEMENTATION_PLAN.md
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── common/                       # Pacote @aivacol/common
│   ├── package.json
│   └── src/
│       ├── entities/
│       │   ├── user.entity.ts
│       │   ├── brand.entity.ts
│       │   ├── model.entity.ts
│       │   └── vehicle.entity.ts
│       ├── dtos/
│       │   ├── create-user.dto.ts
│       │   ├── create-brand.dto.ts
│       │   ├── create-model.dto.ts
│       │   ├── create-vehicle.dto.ts
│       │   ├── update-vehicle.dto.ts
│       │   └── login.dto.ts
│       ├── interfaces/           # Contratos para desacoplamento
│       │   ├── cache.interface.ts
│       │   ├── audit.interface.ts
│       │   └── messaging.interface.ts
│       └── index.ts
│
├── api/                          # NestJS API Principal
│   ├── package.json
│   ├── Dockerfile                # Multi-stage
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── common/
│       │   ├── filters/
│       │   ├── interceptors/
│       │   └── decorators/
│       └── modules/
│           ├── auth/
│           ├── users/
│           ├── brands/
│           ├── models/
│           ├── vehicles/         # Com cache Redis + invalidação
│           └── messaging/        # RabbitMQ producer
│
├── worker/                       # NestJS Standalone – Auditoria Consumer
│   ├── package.json
│   ├── Dockerfile                # Multi-stage, sem EXPOSE
│   └── src/
│       ├── main.ts               # createApplicationContext()
│       ├── app.module.ts
│       └── consumer/
│           ├── consumer.module.ts
│           └── audit-consumer.service.ts   # Consome RabbitMQ, grava em MongoDB
│
└── seed/
    └── seed_vehicles.json
```

**Pontos fortes desta abordagem:**
- Separacao fisica entre API (REST) e worker de auditoria (consumer)
- Worker pode escalar horizontalmente independente da API
- Tipos compartilhados via pacote `common/` garantem consistencia contratual
- Ideal para times maiores (>5 devs) onde limites fisicos de pacotes evitam acoplamento acidental

**Razoes para rejeicao neste projeto:**
- A presenca de DTOs (com decorators `class-validator` e `@ApiProperty`) no pacote `common/` fere o Principio de Inversao de Dependencia — DTOs sao concern da application layer, nao do dominio, e seriam desnecessariamente carregados pelo worker que nao lida com HTTP
- Complexidade adicional de build/teste/Docker (3 Dockerfiles, 3 pacotes, coverage consolidado) sem ganho proporcional de resiliencia — o mesmo resultado de desacoplamento e obtido com EventEmitter2 e listeners no mesmo processo
- Onboarding mais custoso para novos desenvolvedores vs. um unico projeto NestJS padrao
- Over-engineering para o escopo e prazo do desafio

**Cenario onde faria sentido:** Projeto em crescimento com time maior, necessidade de escalar o worker de auditoria independentemente, e SLA critico onde processamento de auditoria compete com CPU da API. Neste momento, a simplicidade do projeto unico com Ports & Adapters e EventEmitter2 atende todos os requisitos de escalabilidade e resiliencia com menor custo operacional.

## Quando Revisitar

Esta decisao deve ser reavaliada se:

- O time crescer alem de 5 desenvolvedores e o acoplamento acidental entre modulos se tornar frequente
- O onboarding de novos membros ultrapassar 2 semanas para atingir produtividade (sinal de que a arquitetura esta custosa demais para o contexto atual)
- Houver necessidade comprovada de escalar o worker de auditoria independentemente da API, justificando o custo operacional do monorepo
