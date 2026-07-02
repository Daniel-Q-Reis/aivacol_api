# ADR-003: Ciclo de vida de dados com soft delete no SQL Server e auditoria no MongoDB

## Status

Aprovado

## Contexto

O dominio de gestao de frota exige rastreabilidade de alteracoes e remocoes. Tambem ha preocupacao de compliance (incluindo principios de LGPD), sem perder capacidade operacional e historico de negocio.

Ao mesmo tempo, o projeto possui auditoria em banco nao relacional (MongoDB) para registrar interacoes de servico.

## Decisao

Adotar estrategia combinada:

- Soft delete no SQL Server (`deleted_at`) para preservar historico operacional no banco principal
- Auditoria complementar no MongoDB com trilha de interacoes e contexto da operacao

Politica de unicidade para ativos:

- Campos de negocio (`license_plate`, `chassis`, `renavam`) devem ser unicos somente para registros ativos
- Em SQL Server, aplicar indice unico filtrado por `deleted_at IS NULL`
- Cobrir em testes o fluxo: criar -> soft delete -> recriar com mesma chave de negocio

Quando houver exigencia de eliminacao definitiva por politica legal especifica, executar fluxo controlado de purge com governanca e trilha de auditoria.

## Consequencias Positivas

- Preserva historico operacional para investigacao e reconciliacao
- Reforca compliance e trilha de auditoria sem apagar contexto de negocio
- Permite restauracao e analise de dados removidos logicamente
- Mantem visao de eventos e contexto detalhado no MongoDB

## Drawbacks

- Aumenta complexidade de consultas (filtros para ignorar registros soft deleted)
- Exige atencao em indices e constraints unicas com dados logicamente removidos
- Pode ampliar custo de armazenamento ao longo do tempo

## Impacto em Performance e Governanca

### Performance de Consultas
- Toda consulta operacional DEVE usar indice cobrindo `WHERE deleted_at IS NULL` para evitar varredura em registros excluidos
- A cada soft delete, o volume de registros com `deleted_at` preenchido cresce; indices parciais mitigam degradacao
- Conforme a base envelhece, considerar janelamento ou archive para cold storage se o volume de dados descartados superar 2x o volume ativo

### Integridade Referencial Logica (Cascade)
- Soft delete de entidade pai (ex: `brand`) DEVE ser **bloqueado** se houver entidades filhas ativas vinculadas (`models` com `deleted_at IS NULL`)
- A logica de bloqueio reside na camada de aplicacao (service), nao no banco
- Se for necessario remover logicamente uma `brand`, todos os `models` e `vehicles` vinculados devem ser soft-deleted primeiro (cascade explicito e orquestrado)

### Dados Sensiveis Pos-Delete
- Campos de negocio (placa, chassi, renavam) permanecem visiveis apos soft delete
- Anonimizacao sera tratada em fluxo separado quando houver requisicao legal explicita (LGPD)
- A auditoria no MongoDB mantem o estado anterior e posterior da operacao para rastreabilidade

### Retencao e TTL da Auditoria no MongoDB
- Indice TTL de 90 dias no campo `timestamp` do schema de auditoria, configurado por padrao
- Prazo de retencao via variavel de ambiente `AUDIT_TTL_DAYS` para adequacao a politicas de compliance
- Registros de auditoria expirados sao automaticamente removidos pelo MongoDB, sem necessidade de job externo

## Guardrails de Implementacao

- Toda consulta operacional deve ignorar registros com `deleted_at` preenchido
- Relatorios historicos podem incluir registros removidos logicamente via filtro explicito
- Fluxo de purge fisico deve ser governado e auditado quando exigido por politica legal especifica

## Alternativas Consideradas

- Hard delete no SQL Server com auditoria apenas no MongoDB
- Soft delete apenas para vehicles e hard delete para demais entidades

Hard delete foi rejeitado por reduzir rastreabilidade no banco principal. Soft delete parcial foi rejeitado por inconsistir a politica de dados entre entidades de negocio.

## Quando Revisitar

Esta decisao deve ser reavaliada se:

- Registros soft-deleted excederem 50% da base ativa, com impacto mensuravel em performance de queries operacionais
- Um requisito legal de anonimizacao de dados pos-delete (LGPD) exigir mascaramento de campos de negocio (placa, chassi, renavam)
- O custo de armazenamento ou a complexidade de manutencao dos dados descartados superar o beneficio do historico operacional
