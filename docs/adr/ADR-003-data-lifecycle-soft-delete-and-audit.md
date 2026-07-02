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

## Alternativas Consideradas

- Hard delete no SQL Server com auditoria apenas no MongoDB
- Soft delete apenas para vehicles e hard delete para demais entidades

Hard delete foi rejeitado por reduzir rastreabilidade no banco principal. Soft delete parcial foi rejeitado por inconsistir a politica de dados entre entidades de negocio.
