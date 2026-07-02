# ADR-004: Indices unicos filtrados no SQL Server com TypeORM via migration SQL raw

## Status

Aprovado

## Contexto

O projeto adota soft delete (`deleted_at`) e exige unicidade apenas para registros ativos em campos de negocio (`license_plate`, `chassis`, `renavam`).

No SQL Server, a abordagem correta para isso e indice unico filtrado com `WHERE deleted_at IS NULL`.

## Problema

Na pratica, o TypeORM nao oferece suporte confiavel para criar esse tipo de indice filtrado de forma declarativa por decorators de entity no SQL Server.

Isso gera risco de retrabalho na Fase 5 se a limitacao nao for antecipada.

## Decisao

Implementar os indices unicos filtrados exclusivamente em migrations com SQL raw usando `queryRunner.query(...)`.

Diretriz de implementacao:

- `up`: criar indices filtrados para ativos
- `down`: remover os indices explicitamente

## Consequencias Positivas

- Regra de unicidade de ativos fica garantida no banco com semantica correta
- Evita surpresa tecnica durante implementacao de migrations
- DDL fica explicito, versionado e auditavel

## Drawbacks

- Maior acoplamento ao dialeto SQL Server nas migrations
- Menor portabilidade imediata para outros bancos sem ajuste de DDL

## Guardrails de Implementacao

- Toda migration que criar indice filtrado deve ter `down` completo
- Teste obrigatorio do fluxo `create -> soft delete -> recreate` com mesma chave de negocio
- Registrar no `ACHIEVEMENTS.md` evidencias do DDL aplicado e do teste de comportamento

## Quando Revisitar

Reavaliar esta decisao se:

- O TypeORM passar a suportar de forma estavel indices filtrados para SQL Server por metadata/decorators
- O projeto migrar de SQL Server para outro banco com estrategia de unicidade diferente para soft delete
