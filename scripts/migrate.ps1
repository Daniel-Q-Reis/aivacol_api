[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "[migrate] N/A nesta fase: package.json ainda nao existe (Fase 2)." -ForegroundColor Yellow
  exit 0
}

$package = Get-Content "package.json" -Raw | ConvertFrom-Json
if (-not $package.scripts."migration:run") {
  Write-Host "[migrate] N/A nesta fase: script npm 'migration:run' ainda nao foi definido." -ForegroundColor Yellow
  exit 0
}

Write-Host "[migrate] Running migrations inside app container..." -ForegroundColor Cyan
docker compose run --rm app npm run migration:run

if ($LASTEXITCODE -ne 0) {
  throw "[migrate] migration:run failed."
}
