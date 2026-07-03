[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "[test-e2e] N/A nesta fase: package.json ainda nao existe (Fase 2)." -ForegroundColor Yellow
  exit 0
}

$package = Get-Content "package.json" -Raw | ConvertFrom-Json
if (-not $package.scripts."test:e2e") {
  Write-Host "[test-e2e] N/A nesta fase: script npm 'test:e2e' ainda nao foi definido." -ForegroundColor Yellow
  exit 0
}

Write-Host "[test-e2e] Running end-to-end tests inside app container..." -ForegroundColor Cyan
docker compose run --rm app npm run test:e2e

if ($LASTEXITCODE -ne 0) {
  throw "[test-e2e] test:e2e failed."
}
