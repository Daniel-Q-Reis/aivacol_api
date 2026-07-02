# ADR-001: Clean Architecture com Ports and Adapters

## Status

Aprovado

## Contexto

O desafio exige arquitetura limpa estrita, desacoplamento entre dominio e infraestrutura, alto nivel de testabilidade e manutencao simples para evolucao.

## Decisao

Adotar Clean Architecture com separacao explicita entre camadas:

- Domain: entidades, excecoes e portas (interfaces)
- Application: casos de uso, DTOs e orquestracao
- Presentation: controllers, guards e contratos HTTP
- Infrastructure: TypeORM, Redis, RabbitMQ, MongoDB e adapters

As dependencias apontam para dentro. O dominio nao importa framework.

## Consequencias Positivas

- Alta testabilidade dos casos de uso com mocks de portas
- Troca de tecnologia com impacto controlado
- Menor acoplamento e melhor manutencao de longo prazo
- Melhor legibilidade de responsabilidades por camada

## Drawbacks

- Mais arquivos e mais boilerplate inicial
- Curva de aprendizado maior para time sem experiencia no padrao
- Maior disciplina de revisao para evitar vazamento de infraestrutura

## Alternativas Consideradas

- Arquitetura em camadas tradicional com repositorios acoplados ao framework
- Estrutura por modulo sem portas explicitas

Essas alternativas foram rejeitadas por menor isolamento do dominio e pior testabilidade.
