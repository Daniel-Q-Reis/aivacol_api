# Runbook: Contingencia de Infra (ambiente local e producao-like)

## Objetivo

Definir resposta padrao para falhas de infraestrutura durante execucao via Docker Compose, reduzindo tempo de recuperacao e evitando perda de consistencia.

## 1) Conflito de portas no host

Sintoma: `Bind for 0.0.0.0:<porta> failed`.

Resposta:

- Identificar processo ocupando a porta.
- Encerrar processo conflitante quando apropriado.
- Se necessario, remapear porta no `docker-compose.yml` e atualizar documentacao.

## 2) Falha de pull/build de imagem

Sintoma: erro em `docker compose up --build` por imagem inexistente ou falha de rede.

Resposta:

- Executar pull manual da imagem especifica.
- Reexecutar build com cache limpo quando necessario.
- Confirmar versoes/tag fixas no compose para evitar drift.

## 3) Scaffold NestJS travando em headless

Sintoma: `npx @nestjs/cli new` aguardando input interativo.

Resposta:

- Garantir flags nao interativas (`--skip-git --skip-install --strict`).
- Se persistir, usar geracao assistida por template documentado no repositorio.

## 4) Falha parcial em migration

Sintoma: migration interrompida deixando schema inconsistente.

Resposta:

- Executar rollback controlado da migration.
- Restaurar backup quando rollback nao for suficiente.
- Revalidar integridade de constraints e indices.
- Registrar incidente no `ACHIEVEMENTS.md` da fase.

## 5) Saturacao de memoria/disco no Windows

Sintoma: containers reiniciando, lentidao extrema, falhas de escrita.

Resposta:

- Verificar recursos alocados no Docker Desktop.
- Limpar volumes/imagens nao utilizados com cautela.
- Ajustar limite de memoria/disco e reiniciar stack.

## 6) Critérios de saida do incidente

- Servicos sobem saudaveis (`docker compose ps`).
- Logs sem erro critico recorrente.
- Fluxo minimo validado: health, auth, leitura de vehicles.
- Acao corretiva registrada no historico da fase.
