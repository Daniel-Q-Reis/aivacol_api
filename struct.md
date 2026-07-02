# struct.md — Mapa de Arquivos do Projeto

> **Atualizado automaticamente pelas IAs executoras ao final de cada ciclo.**
> Última atualização: 2026-07-02 (Fase 0 — Planejamento)
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
| `docs/runbooks/infra-contingency.md` | Runbook de contingencia para falhas de infraestrutura e recuperacao operacional |
| `.agents/` | Diretorio de apoio do ambiente de agentes; sem impacto funcional na aplicacao |

---

*Consulte este arquivo ANTES de criar qualquer novo arquivo para evitar duplicações.*
