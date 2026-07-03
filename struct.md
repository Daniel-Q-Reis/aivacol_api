# struct.md — Mapa de Arquivos do Projeto

> **Atualizado automaticamente pelas IAs executoras ao final de cada ciclo.**
> Última atualização: 2026-07-02 (Fase 1 — Scaffolding e Infraestrutura Docker)
> Nota: este arquivo lista somente o que ja existe no repositorio (nao e roadmap preditivo).

## Regra de Atualização

Ao final de CADA ciclo de trabalho:
1. Executar `git status`
2. Para cada arquivo **criado** (new file) → adicionar à tabela abaixo com caminho e propósito
3. Para cada arquivo **deletado** → remover da tabela
4. **NUNCA criar arquivos duplicados** — consultar esta tabela ANTES de criar qualquer arquivo

---

## Arquivos do Projeto

| Arquivo | Propósito |
|---|---|
| `objetivos.md` | Documento original do desafio (requisitos completos) |
| `MASTER.md` | Documento-mestre: visão geral, arquitetura, regras, convenções, tecnologias |
| `implementation_plan.md` | Plano de implementação detalhado em 8 fases |
| `task.md` | Checklist granular de tarefas para tracking de progresso |
| `struct.md` | Este arquivo — mapa de arquivos do projeto (fonte de verdade) |
| `ACHIEVEMENTS.md` | Registro do que foi implementado em cada fase/bloco |
| `README.md` | Documentacao inicial do projeto com checklist e diferenciais |
| `.gitignore` | Regras de exclusao de arquivos locais/temporarios do Git |
| `docs/adr/ADR-001-clean-architecture.md` | ADR da decisao de arquitetura limpa com ports and adapters |
| `docs/adr/ADR-002-event-driven-decoupling.md` | ADR da estrategia de desacoplamento interno com eventos |
| `docs/adr/ADR-003-data-lifecycle-soft-delete-and-audit.md` | ADR da estrategia de soft delete e auditoria complementar |
| `docs/adr/ADR-004-sqlserver-filtered-unique-indexes-with-typeorm.md` | ADR da decisao de usar SQL raw em migrations para indices filtrados no SQL Server |
| `docs/runbooks/infra-contingency.md` | Runbook de contingencia para falhas de infraestrutura e recuperacao operacional |
| `docker-compose.yml` | Orquestracao Docker da Fase 1 com app, sqlserver, redis, rabbitmq, mongodb e benchmark-runner |
| `Dockerfile` | Build multistage (dev, builder, production) com usuario nao-root e healthcheck no stage final |
| `.dockerignore` | Exclusoes de contexto de build Docker para reduzir ruido e tempo de build |
| `.env` | Variaveis locais de ambiente para desenvolvimento via Docker Compose (arquivo nao versionado) |
| `.env.example` | Template de variaveis de ambiente sem segredos para onboarding/reproducao |
| `scripts/dev.ps1` | Sobe a stack com build e mostra status dos servicos |
| `scripts/stop.ps1` | Desliga containers e remove orfaos da stack local |
| `scripts/logs.ps1` | Stream de logs por servico via Docker Compose |
| `scripts/test.ps1` | Executa cobertura de testes no container app (com fallback N/A na Fase 1) |
| `scripts/test-e2e.ps1` | Executa testes E2E no container app (com fallback N/A na Fase 1) |
| `scripts/lint.ps1` | Executa lint, lint:fix e typecheck no container app (com fallback N/A na Fase 1) |
| `scripts/migrate.ps1` | Executa migrations via container app (com fallback N/A na Fase 1) |
| `scripts/seed.ps1` | Executa seed via container app (com fallback N/A na Fase 1) |
| `scripts/benchmark.ps1` | Entrada oficial de benchmark com `docker compose --profile tools run --rm benchmark-runner` |
| `scripts/benchmark.ts` | Cenarios de benchmark (cache quente/frio) com base padrao `http://app:3000` |
| `scripts/wait-for-deps.js` | Espera ativa de dependencias TCP antes do bootstrap da app |
| `scripts/dev-container-start.js` | Orquestra boot da app no container (wait-for-deps + fallback ate Fase 2) |
| `scripts/placeholder-app.js` | Servidor placeholder para manter app healthy durante a Fase 1 |
| `scripts/container-healthcheck.js` | Healthcheck HTTP interno usado no compose e no stage production |
| `.agents/` | Artefato gerado automaticamente por ferramentas CLI; sem impacto funcional na aplicacao |

---

*Consulte este arquivo ANTES de criar qualquer novo arquivo para evitar duplicações.*
