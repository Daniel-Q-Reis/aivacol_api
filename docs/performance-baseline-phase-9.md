# Fase 9 - Performance Baseline (Pre-otimizacoes)

## Objetivo

Registrar baseline inicial de performance antes de diagnostico N+1 e qualquer otimizacao de query/cache.

## Metodo

- Runner: `scripts/benchmark.ps1` (container `benchmark-runner`)
- Alvo: `GET /api/v1/vehicles?page=1&limit=20&sort=createdAt&order=desc`
- Ordem dos cenarios: **cold primeiro**, depois **warm**
- Duracao: `15s`
- Conexoes: `30`
- Rate limiting durante benchmark: `THROTTLE_LIMIT=1000000` (temporario para evitar 429 enviesando medicao)

## Garantia de Cold Cache

Antes do cenario cold, o benchmark executa:

- `FLUSHDB` no Redis
- `DBSIZE` para evidencia objetiva de limpeza

Evidencia desta execucao:

- `redis DBSIZE after FLUSHDB: 0`

## Resultado Baseline (Before)

| Cenario | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ------- | -------: | -------: | -------: | --------: | -----: | -----: |
| Cold    |       39 |   126.67 |      154 |    574.07 |      0 |      0 |
| Warm    |       39 |    52.33 |       64 |    740.00 |      0 |      0 |

## Leitura Inicial

- Warm supera cold em throughput (~22.42%).
- p95/p99 ficam significativamente melhores em warm, reforcando efeito positivo do cache.
- p50 igual entre cenarios sugere mistura de requests rapidos e lentos no cold (cauda pior, mediana semelhante).

## Observacoes Tecnicas

- O JSON do `autocannon` nao expoe `p95` diretamente em todos os cenarios. O script calcula p95 por interpolacao entre `p90` e `p97_5` quando necessario.
- Este documento representa **baseline pre-otimizacao** e sera comparado com o baseline final apos diagnostico de gargalos/N+1 e ajustes seguros.

## Resultado Baseline (Before) - Reexecucao com Cenario de Capacidade

Com benchmark endurecido para tres cenarios (cold, warm e capacidade):

| Cenario                  | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ------------------------ | -------: | -------: | -------: | --------: | -----: | -----: |
| Cold                     |       41 |   136.00 |      176 |    541.74 |      0 |      0 |
| Warm                     |       38 |    51.67 |       58 |    758.00 |      0 |      0 |
| Capacity (120 conn, 30s) |      152 |   212.33 |      256 |    760.47 |      0 |      0 |

### Leitura da Reexecucao

- Warm vs cold: +28.53% de throughput e melhora expressiva de cauda (p95/p99), mantendo `errors=0` e `non2xx=0`.
- Capacity: throughput proximo ao warm (+0.33%), mas com latencia significativamente maior (p99 +341.38% vs warm), indicando saturacao de capacidade sem quebra funcional.
- Resultado reforca que comparar apenas p50 mascara degradacao sob carga; p95/p99 sao essenciais para decisao de tuning ORM/SQL.

## Plano de Execucao por ROI (Read-Heavy First)

Contexto de negocio/operacao considerado para priorizacao:

- Sistema relacional real tende a ser majoritariamente de leitura.
- Otimizacoes de `GET` em endpoints criticos normalmente entregam maior ganho sistamico que tuning de escrita no curto prazo.
- Benchmark e diagnostico devem refletir perfil read-heavy antes de qualquer tune fino de escrita.

Formula de nota ROI usada nesta fase (escala pratica):

- `ROI Score = (Impacto x Confianca) / Complexidade`
- Impacto, Confianca e Complexidade em escala `1..5`.
- Quanto maior o `ROI Score`, maior prioridade de execucao.

| Prioridade | Iniciativa                             | Objetivo tecnico                                                             | Impacto (1-5) | Confianca (1-5) | Complexidade (1-5) | ROI Score | Expectativa de ganho                                          | Status       |
| ---------- | -------------------------------------- | ---------------------------------------------------------------------------- | ------------: | --------------: | -----------------: | --------: | ------------------------------------------------------------- | ------------ |
| P1         | Query count por request (GET criticos) | Medir queries por request em `vehicles/models/brands/users` e detectar N+1   |             5 |               5 |                  2 |     12.50 | Reducao de p95/p99 em leitura e menor carga no SQL            | Planejado    |
| P2         | Otimizacao de leitura `vehicles`       | Revisar joins/selects/paginacao para evitar sobreconsulta e custo de mapping |             5 |               4 |                  3 |      6.67 | Melhora direta no endpoint de maior volume                    | Planejado    |
| P3         | Otimizacao de leitura `models/brands`  | Eliminar padroes de fetch desnecessario e consolidar consultas               |             4 |               4 |                  3 |      5.33 | Queda de latencia media e de cauda em colecoes auxiliares     | Planejado    |
| P4         | Cache strategy review                  | Validar hit ratio, cardinalidade de chave e invalidacao                      |             4 |               4 |                  3 |      5.33 | Maior estabilidade de warm e menor pressao no banco           | Planejado    |
| P5         | Benchmark read-heavy misto (95/5)      | Medir perfil mais realista com predominio de leitura                         |             4 |               5 |                  3 |      6.67 | Baseline mais aderente ao uso real para decisao de produto    | Planejado    |
| P6         | Race conditions em escrita concorrente | Verificar consistencia sob paralelismo (duplicidade, conflitos, integridade) |             3 |               4 |                  3 |      4.00 | Menor risco de regressao funcional em alta concorrencia       | Planejado    |
| P7         | Benchmark de escrita (POST/PATCH)      | Isolar impacto de caminho com eventos/auditoria assinc                       |             3 |               4 |                  4 |      3.00 | Visibilidade de custo de mutation e SLO de operacoes criticas | Planejado    |
| P8         | Ajustes finos de observabilidade       | Refinar logs/metricas sem ruido para acompanhamento continuo                 |             2 |               5 |                  2 |      5.00 | Melhora governanca de QA e analise de regressao               | Em andamento |

## Estrategia de Benchmark (Ajustada)

Para reduzir vies e aumentar comparabilidade before/after:

1. Cenarios obrigatorios de leitura:
   - `cold cache` (com `FLUSHDB` + `DBSIZE=0` evidenciado)
   - `warm cache`
   - `high-load capacity`
2. Cenarios adicionais orientados a mundo real:
   - `read-heavy mix` (meta inicial: 95% GET / 5% writes)
3. Regras de execucao:
   - Mesmos parametros por rodada before/after (duracao, conexoes, dataset)
   - `THROTTLE_LIMIT` alto temporariamente durante benchmark para evitar vies de `429`
   - Repetir cada suite 3x e registrar mediana (p50/p95/p99, RPS, errors, non2xx)
4. Evidencias minimas por rodada:
   - Saida JSON resumida do benchmark
   - Logs de cold cache (`FLUSHDB` e `DBSIZE`)
   - Registro explicito de variaveis de benchmark usadas

## Log de Ganhos Incrementais (Template)

Tabela para preenchimento progressivo apos cada melhoria aplicada:

| Iteracao | Mudanca aplicada                      | Endpoint(s) alvo | Before (p95/p99/RPS)                                              | After (p95/p99/RPS) | Delta principal    | Evidencia      |
| -------- | ------------------------------------- | ---------------- | ----------------------------------------------------------------- | ------------------- | ------------------ | -------------- |
| 0        | Baseline inicial (cold/warm/capacity) | `/vehicles`      | Cold `136/176/541.74` Warm `51.67/58/758` Cap `212.33/256/760.47` | N/A                 | Referencia inicial | Este documento |
| 1        | A definir (N+1 diagnostico e fix)     | A definir        | TBD                                                               | TBD                 | TBD                | TBD            |
| 2        | A definir (cache/query tuning)        | A definir        | TBD                                                               | TBD                 | TBD                | TBD            |
