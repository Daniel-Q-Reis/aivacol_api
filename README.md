# Aivacol Fleet Management API

Backend para o modulo de Gestao de Frota da Aivacol, planejado com Clean Architecture estrita, foco em seguranca, observabilidade, escalabilidade e qualidade de entrega.

Status atual: fase de planejamento concluida e calibrada. A implementacao comeca pela Fase 1 do `task.md`.

Importante: este repositorio esta em fase de planejamento. Nenhum codigo de aplicacao foi implementado ate este ponto.

## Visao Geral

- Arquitetura: Clean Architecture (Ports and Adapters)
- Stack alvo: NestJS 10+, TypeORM, SQL Server, Redis, RabbitMQ, MongoDB, JWT, Jest
- Entidades principais: vehicles, models, brands, users
- Requisitos de qualidade: cobertura >= 90%, Swagger em `/api/docs`, Docker Compose completo, CI de qualidade

## Como o projeto sera executado

- Ambiente alvo: Windows 11 + PowerShell 7.5+ + Docker Desktop
- Desenvolvimento: 100% via Docker Compose
- Rotas da API: prefixo versionado em `/api/v1`
- Documentacao interativa: `/api/docs`

## ✅ Checklist do Desafio

| Criterio | Status | Observacao |
|---|---|---|
| Arquitetura limpa | 📋 Planejado | Definida no `MASTER.md` com DIP e portas |
| CRUD Vehicles | 📋 Planejado | Fases 4-7 |
| CRUD Models | 📋 Planejado | Fases 4-7 |
| CRUD Brands | 📋 Planejado | Fases 4-7 |
| Users e relacionamento | 📋 Planejado | Seed, autenticacao e consultas protegidas |
| JWT em rotas | 📋 Planejado | Guard global + `@Public()` apenas login/health |
| Redis cache em vehicles | 📋 Planejado | TTL configuravel + invalidacao automatica |
| Swagger/OpenAPI | 📋 Planejado | `/api/docs` com decorators obrigatorios |
| Postman collection | 📋 Planejado | Entrega prevista na raiz |
| Observabilidade | 📋 Planejado | Correlation ID, logging interceptor e filter global |
| RabbitMQ | 📋 Planejado | Estrategia de producao: confirmacao, retry, DLQ e idempotencia |
| Auditoria MongoDB | 📋 Planejado | Default em auth+mutações; leitura configuravel por nivel |
| Docker multistage + Compose | 📋 Planejado | Fase 1 |
| Testes >= 90% | 📋 Planejado | Fase 7 |
| Benchmark | 📋 Planejado | Autocannon em runner dedicado |
| CI (GitHub Actions) | 📋 Planejado | lint + typecheck + test |
| Lint, lint:fix, typecheck | 📋 Planejado | Scripts e gates por fase |

## 🚀 Diferenciais de Engenharia

- Decisoes arquiteturais registradas em ADRs desde o inicio para reduzir ambiguidade de execucao.
- Estrategia de resiliencia: falha de RabbitMQ/MongoDB nao interrompe CRUD no SQL Server.
- Estrategia de ciclo de vida de dados: soft delete no relacional para historico e compliance, com politica de unicidade para registros ativos.
- Planejamento orientado a evidencia (Definition of Done por fase + `struct.md` como fonte de verdade de arquivos).
- Versionamento de API e paginacao previstos desde a base para evolucao sem breaking changes.

## Artefatos de planejamento

- `MASTER.md`
- `implementation_plan.md`
- `task.md`
- `struct.md`
- `ACHIEVEMENTS.md`
- `docs/adr/`

## Contexto rapido para IA (recomendado)

Se voce vai continuar este projeto com apoio de IA e quer minimizar alucinacao, retrabalho e consumo de contexto, inicie cada sessao com este protocolo:

1. Leia -> `MASTER.md`
2. Leia -> `implementation_plan.md`
3. Leia -> `task.md`
4. Leia -> `struct.md`
5. Leia -> `ACHIEVEMENTS.md`
6. Execute -> `git status`
7. Execute -> `git log --oneline -5`
8. Revise -> Secao 12 de `MASTER.md` (Qualidade e Governanca)

Referencias praticas:

- Contexto total aproximado dos documentos-base: ~1700 linhas
- Janela de contexto estimada: ~15000 tokens
- Beneficios: melhor aderencia a arquitetura, menos criacao de arquivos indevidos, menor risco de contradicoes entre fases
