# Runbook: Contingencia de Infra (ambiente local e producao-like)

## Objetivo

Padronizar resposta para falhas da stack Docker da Fase 1, reduzindo MTTR e preservando previsibilidade operacional.

## Escopo

Servicos cobertos: `app`, `sqlserver`, `redis`, `rabbitmq`, `mongodb` e `benchmark-runner`.

---

## 1) Conflito de portas no host

### Sintoma

- `Bind for 0.0.0.0:<porta> failed`
- `Ports are not available`

### Diagnostico (PowerShell)

```powershell
Get-NetTCPConnection -LocalPort 3000,1433,6379,5672,15672,27017 -ErrorAction SilentlyContinue |
  Select-Object LocalPort,State,OwningProcess
```

```powershell
Get-Process -Id <PID>
```

### Resposta

1. Encerrar processo conflitante quando seguro.
2. Se o processo nao puder ser encerrado, remapear a porta no `docker-compose.yml`.
3. Atualizar `README.md` e `ACHIEVEMENTS.md` com o novo mapeamento.
4. Validar novamente com `docker compose up --build -d` e `docker compose ps`.

---

## 2) Falha de pull/build de imagem

### Sintoma

- Erro de rede no pull (`TLS`, timeout, DNS)
- Falha de build no `Dockerfile`

### Diagnostico (PowerShell)

```powershell
docker compose pull
docker compose build --no-cache
```

### Resposta

1. Executar pull manual da imagem com falha.
2. Limpar builder cache apenas se necessario:
   ```powershell
   docker builder prune -f
   ```
3. Reexecutar `docker compose build`.
4. Confirmar se a falha veio de credencial/rede corporativa/proxy.
5. Registrar causa raiz e correcao no `ACHIEVEMENTS.md`.

---

## 3) Scaffold headless fallback

### Sintoma

- `npx @nestjs/cli new` bloqueado aguardando pergunta interativa

### Fluxo principal

```powershell
docker compose run --rm app npx @nestjs/cli new . --package-manager npm --skip-git --skip-install --strict
```

### Fallback

1. Usar modo nao interativo com respostas predefinidas:
   ```powershell
   docker compose run --rm app sh -lc "yes '' | npx @nestjs/cli new . --package-manager npm --skip-git --skip-install --strict"
   ```
2. Se ainda falhar, iniciar scaffold em diretorio temporario dentro do container e copiar estrutura para o volume montado.
3. Validar integridade do scaffold com `docker compose run --rm app ls`.

---

## 4) Rollback de migration parcial

### Sintoma

- Migration interrompida
- Schema parcialmente aplicado

### Resposta

1. Parar escritas concorrentes (`docker compose stop app`).
2. Executar rollback da ultima migration:
   ```powershell
   .\scripts\migrate.ps1
   ```
   (na Fase 2+, substituir por `npm run migration:revert` quando disponivel).
3. Confirmar estado do schema com query de verificacao.
4. Reaplicar migration com logs em modo verboso.
5. Se rollback logico falhar, restaurar backup e repetir deploy da migration.
6. Registrar incidente, causa e comando usado no `ACHIEVEMENTS.md`.

---

## 5) Mitigacao de falta de memoria/disco no Windows

### Sintoma

- Containers reiniciando por OOM
- Build extremamente lento
- Falhas de escrita em volume

### Diagnostico

```powershell
docker system df
docker stats --no-stream
```

### Resposta

1. Ajustar recursos no Docker Desktop (Memory/CPU/Disk).
2. Limpar recursos nao usados com cautela:
   ```powershell
   docker system prune -f
   ```
3. Limpar volumes orfaos apenas quando nao houver risco de perda:
   ```powershell
   docker volume prune -f
   ```
4. Reiniciar Docker Desktop.
5. Subir stack novamente e validar health checks.

---

## Criterios de saida do incidente

1. `docker compose ps` sem servicos em estado de erro.
2. `app`, `sqlserver`, `redis`, `rabbitmq` e `mongodb` em `running` (com `healthy` nos servicos com healthcheck).
3. `docker compose logs app` sem falha recorrente de dependencia.
4. Acao corretiva registrada em `ACHIEVEMENTS.md`.
