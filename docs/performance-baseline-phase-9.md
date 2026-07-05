# Fase 9 - Performance Baseline (Pre-otimizacoes)

## Resumo Executivo (Estado Atual)

- Foi executada uma bateria ampla de tentativas de P1 ate P4 (diagnostico de queries, tuning ORM, cache strategy, L1/L2, tracing e hardening de benchmark).
- As tentativas nao entregaram ganho consistente suficiente para manutencao no codigo principal dentro do tempo disponivel.
- O estado funcional do projeto foi restaurado para baseline estavel, preservando benchmark aprimorado e documentacao.
- P1-P4 ficaram registrados como trilha de experimentacao; parte das mudancas foi deliberadamente descartada por baixa efetividade/alta variancia.
- O comportamento atual indica limite pratico com perfil CPU-bound no ambiente local de desenvolvimento.

## Como Rodar Benchmarks (Comandos Oficiais)

Executar benchmark de leitura (cold/warm/capacity):

```powershell
scripts\benchmark.ps1 -Mode read
```

Executar benchmark de escrita (write-only PATCH, isolado):

```powershell
scripts\benchmark.ps1 -Mode write
```

## Baseline Atual (Dev Rapido)

### Read (modo `read`)

| Cenario                  | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ------------------------ | -------: | -------: | -------: | --------: | -----: | -----: |
| Warm (30 conn, 10s)      |       44 |    62.00 |       78 |    760.10 |      0 |      0 |
| Cold (30 conn, 10s)      |       37 |    94.33 |      123 |    659.40 |      0 |      0 |
| Capacity (120 conn, 18s) |      148 |   198.67 |      249 |    773.34 |      0 |      0 |

### Write (modo `write`, isolado)

| Cenario                         | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ------------------------------- | -------: | -------: | -------: | --------: | -----: | -----: |
| Write-only PATCH (40 conn, 20s) |      319 |   461.33 |      510 |    118.00 |      0 |      0 |

## Leitura de Capacidade e Mercado (Estimativa Operacional)

Premissas observadas/levantadas:

- Saturacao pratica de leitura comecando por volta de ~750 RPS no ambiente atual.
- Saturacao pratica de escrita comecando por volta de ~125 RPS no benchmark isolado.
- Em uso real de locadora, escrita e evento raro por ciclo (ordem de 2 a 10 writes/patches por ciclo de locacao).
- Em leitura, comportamento comum de 1 a 4 requests por minuto por usuario ativo.

Estimativas operacionais (ordem de grandeza, dependentes de campanha/pico e infraestrutura):

- Escrita: suporte aproximado de ate ~10.000 usuarios simultaneos/min em janela critica, com p99 na faixa de ~450-510ms.
- Leitura: suporte aproximado de ~30.000 a ~45.000 usuarios simultaneos, com p99 ate ~250ms.
- Leitura com ajuda efetiva de cache Redis em carga mais conservadora: ~15.000 usuarios com p99 abaixo de ~60ms.

Contexto de negocio:

- para um app de recorrencia menor que rede social, esses numeros indicam folga para base mensal ampla (ordem de 1.000.000+), desde que observados picos sazonais (feriados/promocoes).

## Diagnostico de Recurso (Ambiente Local)

- Indicacao de CPU-bound: durante benchmark, um thread chegou a 100% enquanto demais mantiveram baixa utilizacao no host de 20 threads.
- SSD nao apareceu como gargalo dominante:
  - leitura: ~1% a 2% de uso.
  - escrita: ~9% a 10%, com ~6.2 MB/s observado (arquivos pequenos).
- Hipotese tecnica principal: limite mais associado a serializacao/parsing/transformacao/event-loop do que a I/O de disco.

## Proximos Passos Naturais (Sem Quebra de Contrato)

Para leitura, ainda ha espaco de ganho com:

- reduzir trabalho de serializacao/transformacao (DTO/class-transformer);
- reduzir payload JSON de resposta;
- evitar parsing/copy desnecessario;
- escalar horizontalmente app (`docker compose up --scale app=...`) com balanceamento.

Para resiliencia de pico de escrita:

- usar a mensageria RabbitMQ ja implementada para fluxo assincrono de escrita e retorno `202 Accepted` (ao inves de `200` sincrono), como proxima evolucao caso o tempo permita.

## Nota sobre P1-P4 e Decisao de Reversao

- P1 a P4 foram executados e medidos.
- P4 (combinacoes L1/L2 e controles adicionais) apresentou degradacao relevante em rodada chave (ordem de ~13% no contexto medido).
- Dada a variancia e o tempo, as mudancas experimentais foram revertidas para baseline funcional estavel.

---

## Historico Detalhado de Tentativas (Ruido de Desenvolvimento)

As secoes abaixo mantem o historico completo de testes e iteracoes da fase 9. Elas permanecem como trilha de engenharia e governanca, mas nao refletem necessariamente o estado final aprovado de codigo.

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
| P1         | Query count por request (GET criticos) | Medir queries por request em `vehicles/models/brands/users` e detectar N+1   |             5 |               5 |                  2 |     12.50 | Reducao de p95/p99 em leitura e menor carga no SQL            | Concluido    |
| P2         | Otimizacao de leitura `vehicles`       | Revisar joins/selects/paginacao para evitar sobreconsulta e custo de mapping |             5 |               4 |                  3 |      6.67 | Melhora direta no endpoint de maior volume                    | Concluido    |
| P3         | Otimizacao de leitura `models/brands`  | Eliminar padroes de fetch desnecessario e consolidar consultas               |             4 |               4 |                  3 |      5.33 | Queda de latencia media e de cauda em colecoes auxiliares     | Concluido*   |
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

| Iteracao | Mudanca aplicada                      | Endpoint(s) alvo                | Before (p95/p99/RPS)                                              | After (p95/p99/RPS)  | Delta principal                    | Evidencia               |
| -------- | ------------------------------------- | ------------------------------- | ----------------------------------------------------------------- | -------------------- | ---------------------------------- | ----------------------- |
| 0        | Baseline inicial (cold/warm/capacity) | `/vehicles`                     | Cold `136/176/541.74` Warm `51.67/58/758` Cap `212.33/256/760.47` | N/A                  | Referencia inicial                 | Este documento          |
| 1        | P1 - Query count por request          | `vehicles/models/brands/users`  | `vehicles=2q, models=1q, brands=1q, users=1q`                     | N/A                  | Sem N+1 detectado nesta rodada     | Logs `queryDiagnostics` |
| 2        | P2/P3 - query tuning leitura          | `vehicles` + validacao dominios | `vehicles=2q (cold)`                                              | `vehicles=1q (cold)` | -50% queries no cold de `vehicles` | Logs `queryDiagnostics` |

## P1 - Query Count por Request (Execucao Inicial)

Instrumentacao aplicada para diagnostico controlado por ambiente:

- `DB_QUERY_DIAGNOSTICS_ENABLED=true` habilita logger TypeORM de diagnostico (desligado por padrao em producao).
- `DB_SLOW_QUERY_THRESHOLD_MS` define limiar de slow query para contagem de ocorrencias lentas.
- `LoggingInterceptor` inclui `queryDiagnostics` por request (`queryCount`, `slowQueryCount`, `sampleQueries`).

### Evidencias coletadas (GET criticos)

| Endpoint                                                         | Status | queryCount | slowQueryCount | Leitura tecnica                                                |
| ---------------------------------------------------------------- | -----: | ---------: | -------------: | -------------------------------------------------------------- |
| `GET /api/v1/vehicles?page=1&limit=20&sort=createdAt&order=desc` |    200 |          2 |              0 | `findAndCount`: 1 query de dados + 1 query de count (esperado) |
| `GET /api/v1/models`                                             |    200 |          1 |              0 | Consulta unica, sem padrao N+1                                 |
| `GET /api/v1/brands`                                             |    200 |          1 |              0 | Consulta unica, sem padrao N+1                                 |
| `GET /api/v1/users`                                              |    200 |          1 |              0 | Consulta unica, sem padrao N+1                                 |

### Conclusao P1 (parcial)

- Nao foi identificado padrao N+1 nos endpoints de leitura avaliados nesta rodada inicial.
- O endpoint de veiculos apresenta custo fixo de 2 queries por pagina por usar `findAndCount` (nao e N+1, mas e custo relevante para alto volume).
- Proxima etapa de ROI: otimizar caminho de leitura de `vehicles` (P2), avaliar alternativas de paginacao/count e medir impacto em p95/p99.

## P2/P3 - Otimizacoes Aplicadas

### Mudancas executadas

- `vehicles`: substituicao de `findAndCount` por query unica com `COUNT(1) OVER()` em `src/modules/vehicles/infrastructure/persistence/repositories/typeorm-vehicle.repository.ts`.
- `vehicles`: fallback defensivo de `count` apenas quando pagina > 1 retorna sem linhas (preserva `total` consistente).
- `models` e `brands`: mantidos sem mudanca estrutural por ja apresentarem query unica e ausencia de N+1 no P1.
- `users`: tentativa de reduzir payload removendo `passwordHash` da consulta foi revertida por dependencias de dominio (`User` exige esse campo na modelagem atual).

### Evidencias apos P2/P3

| Endpoint                                                         | Status | queryCount (cold) | queryCount (warm) | Observacao                                                            |
| ---------------------------------------------------------------- | -----: | ----------------: | ----------------: | --------------------------------------------------------------------- |
| `GET /api/v1/vehicles?page=1&limit=20&sort=createdAt&order=desc` |    200 |                 1 |                 0 | Reducao de 2 para 1 query em cache cold; warm segue cache hit sem SQL |
| `GET /api/v1/models`                                             |    200 |                 1 |               N/A | Sem regressao; continua consulta unica                                |
| `GET /api/v1/brands`                                             |    200 |                 1 |               N/A | Sem regressao; continua consulta unica                                |
| `GET /api/v1/users`                                              |    200 |                 1 |               N/A | Mantido estavel apos rollback da tentativa de otimizar selecao        |

### Nota de escopo P3

- `P3` foi concluido como validacao/estabilizacao: os endpoints de `models/brands` ja estavam otimizados no baseline atual e permaneceram sem N+1.

## Benchmark After (Pos P2/P3)

Mesmos parametros do baseline before endurecido:

- Cold/Warm: `30` conexoes por `15s`
- Capacity: `120` conexoes por `30s`
- `THROTTLE_LIMIT=1000000`

| Cenario                  | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ------------------------ | -------: | -------: | -------: | --------: | -----: | -----: |
| Cold                     |       40 |   104.33 |      140 |    607.14 |      0 |      0 |
| Warm                     |       38 |    55.33 |       67 |    744.00 |      0 |      0 |
| Capacity (120 conn, 30s) |      161 |   226.67 |      287 |    717.84 |      0 |      0 |

## Comparacao Before vs After

`Before` considerado: baseline endurecido registrado anteriormente (cold/warm/capacity).

| Cenario  | Metrica   | Before |  After |   Delta |
| -------- | --------- | -----: | -----: | ------: |
| Cold     | RPS medio | 541.74 | 607.14 | +12.07% |
| Cold     | p95 (ms)  | 136.00 | 104.33 | -23.29% |
| Cold     | p99 (ms)  |    176 |    140 | -20.45% |
| Warm     | RPS medio | 758.00 | 744.00 |  -1.85% |
| Warm     | p95 (ms)  |  51.67 |  55.33 |  +7.08% |
| Warm     | p99 (ms)  |     58 |     67 | +15.52% |
| Capacity | RPS medio | 760.47 | 717.84 |  -5.61% |
| Capacity | p99 (ms)  |    256 |    287 | +12.11% |

### Leitura dos resultados

- Ganho material no cenario **cold** (objetivo de query tuning): menos queries por request e melhora forte de cauda.
- Cenario **warm/capacity** oscilou negativamente nesta rodada unica; requer repeticao em 3 execucoes e mediana para conclusao estatistica robusta.
- Sem erros funcionais: `errors=0` e `non2xx=0` em todos os cenarios.

## Benchmark Segregado por Tipo de Carga (Read x Write)

Observacao importante de QA:

- A primeira tentativa de write benchmark usou `BENCHMARK_WRITE_YEAR=2030`, gerando `400 VEHICLE_VALIDATION_ERROR` por regra de dominio (`year` precisa estar entre `1886` e `anoAtual+1`).
- Ajuste aplicado: `BENCHMARK_WRITE_YEAR=2027` para payload valido no ciclo atual.

### Resultado consolidado (com payload write valido)

| Cenario       | Tipo                          | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ------------- | ----------------------------- | -------: | -------: | -------: | --------: | -----: | -----: |
| Cold          | Read (`GET /vehicles`)        |       39 |   100.67 |      137 |    631.40 |      0 |      0 |
| Warm          | Read (`GET /vehicles`)        |       36 |    48.00 |       56 |    800.00 |      0 |      0 |
| Capacity      | Read (`GET /vehicles`)        |      147 |   198.33 |      240 |    806.50 |      0 |      0 |
| Write-focused | Write (`PATCH /vehicles/:id`) |      710 |   959.33 |     1032 |     56.30 |      0 |      0 |

### Leitura tecnica da segregacao

- Read path permanece com alta vazao e boa latencia em warm.
- Write path tem custo significativamente maior (ordem de grandeza superior em latencia), o que era mascarado no benchmark antigo focado em GET.
- Este recorte confirma que os gargalos restantes nao estao apenas no cache de leitura; o caminho de mutacao precisa analise dedicada (validacao, verificacoes de unicidade, update SQL, invalidacao de cache e eventos/auditoria).

## Diagnostico de Gargalo por Etapa (Tracing FindAll)

Instrumentacao adicionada:

- Evento de performance: `perf.vehicle.findAll.timing`.
- Campos rastreados por request: `cacheGetMs`, `repositoryFindAllMs`, `mappingMs`, `cacheSetMs`, `totalMs`, `source`, `key`.
- Listener de observabilidade: `src/modules/vehicles/infrastructure/listeners/vehicle-perf.listener.ts`.

### Evidencia estatistica (amostra do benchmark)

Total de eventos avaliados: `24.289`

- `source=cache`: `23.107`
- `source=database`: `1.182`
- Hit ratio aproximado: `95,13%`

#### Source = database (n=1.182)

| Etapa                 | p50 (ms) | p95 (ms) | p99 (ms) | Leitura                                 |
| --------------------- | -------: | -------: | -------: | --------------------------------------- |
| `cacheGetMs`          |       13 |    28.00 |    34.00 | Overhead inicial moderado em miss       |
| `repositoryFindAllMs` |       49 |   110.95 |   146.38 | **Maior gargalo em miss**               |
| `mappingMs`           |        0 |        0 |        1 | Irrelevante no custo total              |
| `cacheSetMs`          |       10 |    28.00 |    36.00 | Custo secundario perceptivel            |
| `totalMs`             |       74 |   133.00 |   169.38 | Cauda puxada por repository + cache set |

#### Source = cache (n=23.107)

| Etapa        | p50 (ms) | p95 (ms) | p99 (ms) | Leitura                         |
| ------------ | -------: | -------: | -------: | ------------------------------- |
| `cacheGetMs` |       33 |       84 |       99 | **Dominante no caminho hit**    |
| `totalMs`    |       33 |       84 |       99 | Equivale ao custo de `cacheGet` |

### Conclusao tecnica do tracing

- Em miss, o maior custo esta no repositorio (`repositoryFindAllMs`).
- Em hit, o maior custo esta no acesso ao Redis (`cacheGetMs`), nao no mapping.
- Existe sinal de **thundering herd** em chaves quentes de lista (varias misses concorrentes pela mesma chave antes do primeiro `set`).

## P4 - Cache Strategy Review (Direcionado por Dados)

Acao aplicada nesta rodada:

- Implementado **singleflight in-process** para `findAll` em `VehicleService`:
  - evita buscas duplicadas para a mesma chave quando o cache ainda nao foi preenchido;
  - requests concorrentes aguardam a primeira consulta e recebem o mesmo resultado;
  - nova fonte de rastreio: `source=singleflight`.

Objetivo esperado do ajuste:

- Reduzir p95/p99 em janela de miss concorrente.
- Reduzir pressao simultanea sobre SQL e `cache.set` para mesma chave.
- Melhorar estabilidade de cauda sem alterar contrato funcional da API.

Proximo passo imediato:

- Reexecutar benchmark com mesma configuracao e comparar variacao de `source=database` vs `source=singleflight` e impacto em p95/p99 global.

### Evolucao P4 (execucao atual)

Alteracoes implementadas nesta etapa:

- `VehicleService` passou a usar deduplicacao in-process por chave (`listFetchInFlight`) para reduzir fetch concorrente duplicado.
- Ajuste de fluxo para checar `inFlight` antes do caminho principal e resolver cache/database via funcao unica.
- Valido por `vehicle.service.spec.ts` + `typecheck`.

#### Resultado do benchmark apos P4

| Cenario       | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ------------- | -------: | -------: | -------: | --------: | -----: | -----: |
| Cold          |       51 |   139.33 |      178 |    468.70 |      0 |      0 |
| Warm          |       45 |    58.33 |       65 |    639.00 |      0 |      0 |
| Capacity      |      152 |   192.33 |      222 |    648.90 |      0 |      0 |
| Write-focused |      245 |   288.00 |      306 |    100.30 |      0 |      0 |

#### Tracing apos P4 (findAll)

Fonte de eventos `perf.vehicle.findAll.timing` (24.219 eventos):

- `cache`: 23.011 (95.01%)
- `database`: 1.208 (4.99%)
- `singleflight`: 0 (0.00%)

| Source   | Etapa                | p50 (ms) | p95 (ms) | p99 (ms) |
| -------- | -------------------- | -------: | -------: | -------: |
| cache    | cacheGetMs / totalMs |       34 |       64 |       76 |
| database | cacheGetMs           |       12 |       29 |       37 |
| database | repositoryFindAllMs  |       43 |       96 |      124 |
| database | cacheSetMs           |        7 |       28 |       37 |
| database | totalMs              |       65 |      125 |      153 |

#### Leitura de efetividade

- O mix de fontes melhorou levemente (`cache` +0.28 p.p.; `database` -0.28 p.p. vs rodada anterior), mas sem evidenciar ativacao de `singleflight` no periodo medido.
- Gargalo estrutural permanece: `repositoryFindAllMs` em misses e `cacheGetMs` em hits.
- Em ambiente single-node, o padrao observado sugere baixa janela de colisao no miss para mesma chave durante os lotes medidos; a deduplicacao nao trouxe efeito mensuravel nesta rodada.

#### Proxima acao direcionada

- Focar em reduzir custo de `cacheGetMs` e `cacheSetMs` (caminho hit/miss) e manter tune de query no repositorio, com nova rodada comparavel.

## P4.1 - Ajuste de Cliente Redis + Validacao de Singleflight

Ajustes aplicados no cliente Redis (`redis-cache.service.ts`):

- `connectTimeout` configuravel por env (`REDIS_CONNECT_TIMEOUT_MS`).
- `commandTimeout` configuravel por env (`REDIS_COMMAND_TIMEOUT_MS`).
- `enableOfflineQueue=false` para evitar backlog silencioso de comandos quando conexao nao estiver pronta.

Env adicionadas:

- `REDIS_CONNECT_TIMEOUT_MS=5000`
- `REDIS_COMMAND_TIMEOUT_MS=1500`

Validacao de qualidade:

- `cache.config.spec.ts` atualizado para novos defaults.
- `vehicle.service.spec.ts` e `typecheck` passaram sem regressao.

### Benchmark apos P4.1

| Cenario       | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ------------- | -------: | -------: | -------: | --------: | -----: | -----: |
| Cold          |       40 |    60.00 |       94 |    699.00 |      0 |      0 |
| Warm          |       34 |    49.33 |       57 |    810.00 |      0 |      0 |
| Capacity      |      111 |   154.33 |      186 |    855.00 |      0 |      0 |
| Write-focused |      207 |   293.00 |      349 |    114.80 |      0 |      0 |

### Tracing apos P4.1

Eventos `perf.vehicle.findAll.timing`: `32.354`

| Source       |  Count |  Ratio |
| ------------ | -----: | -----: |
| cache        |    640 |  1.98% |
| database     |     41 |  0.13% |
| singleflight | 31.673 | 97.90% |

Percentis por source (ms):

| Source       | Etapa          | p50 | p95 | p99 |
| ------------ | -------------- | --: | --: | --: |
| cache        | cacheGet/total |  24 |  78 |  98 |
| database     | total          |  27 |  49 |  76 |
| singleflight | total          |  20 |  68 |  82 |

### Leitura tecnica P4.1

- O ajuste de Redis + deduplicacao reduziu drasticamente o caminho direto de banco (`database` 4.99% -> 0.13%) e elevou throughput em todos os cenarios medidos nesta rodada.
- `singleflight` passou a ser dominante sob concorrencia alta para chave quente, prevenindo tempestade de misses (objetivo de protecao alcancado).
- Em contrapartida, o tempo de espera em `singleflight` (p95 ~68ms) torna-se a principal cauda em rajadas; e um trade-off esperado de controle de concorrencia.

---

## Consolidacao Humana da Fase 9 (Decisao de Rota)

### O que foi tentado e descartado no codigo principal

As tentativas abaixo foram uteis para aprendizado e diagnostico, mas nao entraram como estrategia definitiva de produto nesta rodada:

- instrumentacao invasiva de diagnostico no runtime da API para cada request;
- ajustes de singleflight/L1 no caminho principal sem estabilidade estatistica suficiente entre rodadas;
- mudancas que aproximavam alteracao de contrato/semantica sem ganho consistente comprovado.

Motivo do descarte nesta etapa:

- objetivo de preservar principios basilares (rotas protegidas, governanca e conformidade);
- variancia alta entre benchmarks, sem sinal robusto para justificar manter mudancas sensiveis;
- preferencia por plano mais objetivo e incremental com menor risco arquitetural imediato.

### O que foi preservado como legado tecnico desta fase

- benchmark endurecido e mais representativo (`cold`, `warm`, `capacity`, `write-focused PATCH`);
- documentacao de evidencias, tentativas e trade-offs desta fase;
- licoes aprendidas para tomada de decisao tecnica da proxima iteracao.

### Novo plano de acao (apos limpeza seletiva do codigo)

1. Restaurar codigo para estado funcional estavel, mantendo apenas benchmark/documentacao/governanca.
2. Levantar baseline canonico novamente com o benchmark completo (3 rodadas e mediana).
3. Focar em ganho de alto ROI sem grande quebra de contrato:
   - validar plano de execucao SQL Server no `findAll` quente;
   - criar/ajustar indices compostos com `INCLUDE` para queries cobertas;
   - reduzir custo de hydration com projecoes mais enxutas (quando aplicavel).
4. Reexecutar benchmark identico e comparar before/after de forma estrita.
5. Somente depois avaliar evolucoes maiores (ex.: async writes) como fase arquitetural dedicada.

### Registro de decisao

- Decisao atual: priorizar estabilidade, rastreabilidade e ganho comprovavel.
- Resultado esperado: menor risco de regressao funcional com melhora de performance orientada por evidencia.

## Baseline Limpo Revalidado (Rodadas Canonicas)

Contexto da medicao:

- ambiente limpo apos restore seletivo;
- benchmark completo (`cold`, `warm`, `capacity`, `write-focused`);
- `THROTTLE_LIMIT=1000000` para evitar vies por `429`;
- 3 rodadas para leitura por mediana.

Mediana das 3 rodadas executadas:

| Cenario                            | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio |
| ---------------------------------- | -------: | -------: | -------: | --------: |
| Cold (30 conn, 15s)                |       45 |   144.67 |      180 |    505.14 |
| Warm (30 conn, 15s)                |       38 |    52.00 |       59 |    758.00 |
| Capacity (120 conn, 30s)           |      138 |   210.67 |      254 |    828.90 |
| Write-focused PATCH (40 conn, 20s) |      538 |   811.00 |      967 |     70.25 |

Observacao:

- o benchmark sempre gera `p50`, `p95` e `p99`; quando algum relatorio resumido omitiu `p50`, foi apenas omissao de comunicacao, nao falta de metrica no script.

## Ajuste Operacional de Duracao do Benchmark

Para reduzir ciclo de desenvolvimento, foi testado ajuste de duracao:

- `BENCHMARK_DURATION_SECONDS`: `15` -> `10`
- `BENCHMARK_CAPACITY_DURATION_SECONDS`: `30` -> `18`
- conexoes mantidas (`30` read e `120` capacity)

Resultado da rodada de validacao com tempos reduzidos:

| Cenario                            | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio |
| ---------------------------------- | -------: | -------: | -------: | --------: |
| Cold (30 conn, 10s)                |       39 |   127.67 |      174 |    573.00 |
| Warm (30 conn, 10s)                |       34 |    44.00 |       60 |    845.46 |
| Capacity (120 conn, 18s)           |      137 |   167.00 |      181 |    863.89 |
| Write-focused PATCH (40 conn, 20s) |      303 |   410.67 |      467 |    126.35 |

Leitura comparativa com a mediana canonica (15s/30s):

- houve variacoes acima de 5% em multiplas metricas, principalmente em `write` e nos cenarios cold/capacity;
- conclusao: os tempos reduzidos sao uteis para feedback rapido local, mas **nao** substituem baseline oficial comparavel da fase.

## Benchmark de Write Desacoplado (Consistencia)

Devido a variacao abrupta observada no write quando executado ao final da suite de leitura, o write passou a ser tratado como benchmark separado para evitar contaminacao de fase anterior.

Script dedicado:

- `scripts/benchmark-write.ts`

Comandos oficiais via PowerShell:

- `scripts\benchmark.ps1 -Mode read`
- `scripts\benchmark.ps1 -Mode write`

Protocolo:

- manter `writeDuration=20s` e `writeConnections=40`;
- executar em rodada isolada (sem cold/warm/capacity antes);
- registrar p50/p95/p99 e RPS com `errors=0` e `non2xx=0`.

Objetivo:

- obter baseline de escrita com menor variancia para comparacao before/after de otimizacoes.

Resultado inicial do write isolado (20s, 40 conexoes):

| Cenario          | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ---------------- | -------: | -------: | -------: | --------: | -----: | -----: |
| Write-only PATCH |      304 |   396.33 |      428 |    125.65 |      0 |      0 |

Leitura:

- comparado ao write executado no fim da suite mista, a variancia cai e o p99 deixa de oscilar em saltos anormais;
- este formato passa a ser a referencia para auditoria de escrita, mantendo a suite mista focada na leitura.

## Baseline Oficial Atual (Mediana de 2 Passadas)

Data da coleta: `2026-07-05`

Protocolo desta rodada oficial:

- Ambiente limpo apos `git restore` + `git clean` (sem alteracoes locais de codigo).
- Suite principal: `scripts/benchmark.ts` (cold, warm, capacity, write-focused) executada 2x.
- Suite de escrita isolada: `scripts/benchmark-write.ts` executada 2x.
- Mediana com 2 amostras: media aritmetica entre as duas execucoes.
- Em todas as execucoes: `errors=0` e `non2xx=0`.

### Passadas coletadas (suite principal)

| Passada | Cenario       | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio |
| ------- | ------------- | -------: | -------: | -------: | --------: |
| 1       | Cold          |       38 |   102.00 |      151 |    626.00 |
| 1       | Warm          |       36 |    56.67 |       84 |    756.00 |
| 1       | Capacity      |      151 |   249.33 |      319 |    757.78 |
| 1       | Write-focused |      319 |   486.00 |      631 |    118.45 |
| 2       | Cold          |       50 |   149.33 |      212 |    455.00 |
| 2       | Warm          |       50 |    92.00 |      134 |    549.00 |
| 2       | Capacity      |      142 |   307.33 |      336 |    685.50 |
| 2       | Write-focused |      335 |   495.00 |      598 |    111.50 |

### Baseline oficial (mediana de 2 passadas) - Suite principal

| Cenario       | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ------------- | -------: | -------: | -------: | --------: | -----: | -----: |
| Cold          |    44.00 |   125.67 |   181.50 |    540.50 |      0 |      0 |
| Warm          |    43.00 |    74.34 |   109.00 |    652.50 |      0 |      0 |
| Capacity      |   146.50 |   278.33 |   327.50 |    721.64 |      0 |      0 |
| Write-focused |   327.00 |   490.50 |   614.50 |    114.98 |      0 |      0 |

### Passadas coletadas (write isolado)

| Passada | Cenario          | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio |
| ------- | ---------------- | -------: | -------: | -------: | --------: |
| 1       | Write-only PATCH |      415 |   610.67 |      705 |     91.85 |
| 2       | Write-only PATCH |      326 |   510.67 |      596 |    115.65 |

### Baseline oficial (mediana de 2 passadas) - Write isolado

| Cenario          | p50 (ms) | p95 (ms) | p99 (ms) | RPS medio | errors | non2xx |
| ---------------- | -------: | -------: | -------: | --------: | -----: | -----: |
| Write-only PATCH |   370.50 |   560.67 |   650.50 |    103.75 |      0 |      0 |

## Registro de Tentativas (Resumo Humano)

Para facilitar leitura humana, as tentativas desta fase ficam resumidas aqui em ordem cronologica, sem apagar o historico detalhado acima.

1. Baseline inicial pre-otimizacao (cold/warm), depois baseline endurecido com capacity.
2. Tentativas de tuning de leitura (P1, P2, P3) com instrumentacao de query count e comparacoes before/after.
3. Tentativas de cache/singleflight (P4/P4.1) com ganhos em algumas rodadas e alta variancia entre execucoes.
4. Decisao de consolidacao: restaurar estado limpo, manter governanca e benchmark mais rastreavel.
5. Nova coleta oficial apos restore, com protocolo fixo de 2 passadas para baseline atual.

## Estado Atual de Qualidade

- Testes unitarios: passando (`46/46`).
- Testes e2e: passando (`6/6`) na reexecucao da suite.
- Benchmarks (suite principal e write isolado): passando com `errors=0` e `non2xx=0`.
