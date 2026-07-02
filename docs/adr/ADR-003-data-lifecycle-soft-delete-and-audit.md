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

## Guardrails de Implementacao

- Toda consulta operacional deve ignorar registros com `deleted_at` preenchido
- Relatorios historicos podem incluir registros removidos logicamente via filtro explicito
- Fluxo de purge fisico deve ser governado e auditado quando exigido por politica legal especifica

## Alternativas Consideradas

- Hard delete no SQL Server com auditoria apenas no MongoDB
- Soft delete apenas para vehicles e hard delete para demais entidades

Hard delete foi rejeitado por reduzir rastreabilidade no banco principal. Soft delete parcial foi rejeitado por inconsistir a politica de dados entre entidades de negocio.
