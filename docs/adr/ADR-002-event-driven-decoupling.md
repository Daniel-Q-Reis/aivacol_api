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

Chamada direta foi rejeitada por acoplamento alto. Outbox foi adiado para manter escopo inicial enxuto, podendo ser evolucao futura.
