[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "[test] N/A nesta fase: package.json ainda nao existe (Fase 2)." -ForegroundColor Yellow
  exit 0
}

$package = Get-Content "package.json" -Raw | ConvertFrom-Json
if (-not $package.scripts."test:cov") {
  Write-Host "[test] N/A nesta fase: script npm 'test:cov' ainda nao foi definido." -ForegroundColor Yellow
  exit 0
}

Write-Host "[test] Running test coverage inside app container..." -ForegroundColor Cyan
docker compose run --rm app npm run test:cov

if ($LASTEXITCODE -ne 0) {
  throw "[test] test:cov failed."
}
