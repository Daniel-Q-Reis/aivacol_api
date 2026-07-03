[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "[seed] N/A nesta fase: package.json ainda nao existe (Fase 2)." -ForegroundColor Yellow
  exit 0
}

$package = Get-Content "package.json" -Raw | ConvertFrom-Json
if (-not $package.scripts.seed) {
  Write-Host "[seed] N/A nesta fase: script npm 'seed' ainda nao foi definido." -ForegroundColor Yellow
  exit 0
}

Write-Host "[seed] Running seed inside app container..." -ForegroundColor Cyan
docker compose run --rm app npm run seed

if ($LASTEXITCODE -ne 0) {
  throw "[seed] seed failed."
}
