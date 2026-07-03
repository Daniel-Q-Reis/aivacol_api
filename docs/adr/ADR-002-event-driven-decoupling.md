# ADR-002: Desacoplamento interno com EventEmitter2

## Status

Aprovado

## Contexto

O desafio exige mensageria RabbitMQ para eventos de veiculos e auditoria em MongoDB sem interromper o fluxo principal de CRUD no SQL Server quando sistemas externos estiverem indisponiveis.

## Decisao

Usar EventEmitter2 como barramento interno. Services publicam eventos de dominio e listeners especializados executam efeitos secundarios:

- listener de mensageria publica em RabbitMQ
- listener de auditoria grava no MongoDB

Listeners sao resilientes: erros sao logados e nao relancados.

Para primeira versao em padrao de producao:

- Publicacao com `publisher confirms`
- Retry com backoff exponencial para falhas transientes
- Mensagens nao processadas seguem para DLQ apos limite de tentativas
- Eventos incluem `eventId` para idempotencia no consumo

## Consequencias Positivas

- CRUD principal permanece disponivel mesmo com falhas externas
- Reducao de acoplamento entre caso de uso e infraestrutura
- Melhor extensibilidade para novos listeners sem alterar services

## Drawbacks

- Fluxo assincrono exige observabilidade e correlacao robustas
- Maior complexidade de troubleshooting em cenarios de perda de evento
- Exige idempotencia e estrategia clara de retry quando aplicavel

## Guardrails de Implementacao

- Definir contratos de evento versionados
- Incluir metadados minimos (`eventId`, `occurredAt`, `entityId`, `correlationId`)
- Testar cenarios de duplicidade, falha temporaria e roteamento para DLQ

## Alternativas Consideradas

- Chamada direta de RabbitMQ/MongoDB dentro dos services
- Uso de outbox pattern ja na primeira versao

### Trade-off de biblioteca RabbitMQ no NestJS

- Opcao adotada: `@golevelup/nestjs-rabbitmq`
- Alternativa avaliada: `@nestjs/microservices`

Justificativa pratica para este contexto:

- `@golevelup/nestjs-rabbitmq` oferece ergonomia melhor para publicacao orientada a exchange/routing key,
  incluindo configuracao direta de topology e caminho mais objetivo para confirm/retry/DLQ na borda de publicacao.
- `@nestjs/microservices` padroniza transporte no ecossistema Nest, mas neste caso exigiria mais adaptacao
  para chegar ao mesmo nivel de controle de publicacao resiliente exigido no projeto.

Consequencia:

- Mantemos a abstracao no dominio por `IEventPublisher`, preservando a possibilidade de troca futura de biblioteca
  sem impacto na camada de regras de negocio.

Chamada direta foi rejeitada por acoplamento alto.

**Outbox Pattern** — Garantiria exactly-once delivery via tabela `outbox` + polling/CDC. Rejeitado nesta versao porque:

- Adiciona latencia minima ao CRUD (transacao + insert na outbox)
- Exige consumer separado ou Debezium para ler a outbox
- Para o SLA deste projeto, perda eventual de eventos de auditoria e aceitavel (regra de negocio nao depende deles)
- Previsto como evolucao futura se houver requisito de garantia de entrega

## Trade-offs de Garantia de Entrega

O modelo com EventEmitter2 e **at-most-once**: se o processo Node.js morrer entre o `emit()` e o listener executar, o evento e perdido.

Isto e uma escolha consciente:

- Eventos de auditoria e mensageria sao **efeitos secundarios**, nao parte da transacao principal
- A regra de negocio (CRUD de veiculos) e consistente por si so no SQL Server
- Para o escopo do desafio, perda eventual de eventos e aceitavel
- Se no futuro houver exigencia de garantia de entrega, a migracao para outbox pattern e direta: os services ja emitem eventos via EventEmitter2, bastando substituir o listener para persistir na tabela `outbox` em vez de publicar diretamente

## Quando Revisitar

Esta decisao deve ser reavaliada se:

- O negocio passar a exigir garantia de exactly-once delivery para eventos de veiculos
- A perda eventual de eventos de auditoria for considerada inaceitavel pelo compliance
- O volume de eventos exceder a capacidade do EventEmitter2 in-process, causando contencao no event loop do Node.js
