[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json")) {
  Write-Host "[lint] N/A nesta fase: package.json ainda nao existe (Fase 2)." -ForegroundColor Yellow
  exit 0
}

$package = Get-Content "package.json" -Raw | ConvertFrom-Json
$hasLint = $null -ne $package.scripts.lint
$hasLintFix = $null -ne $package.scripts."lint:fix"
$hasTypecheck = $null -ne $package.scripts.typecheck

if (-not ($hasLint -and $hasLintFix -and $hasTypecheck)) {
  Write-Host "[lint] N/A nesta fase: scripts lint/lint:fix/typecheck ainda nao foram definidos." -ForegroundColor Yellow
  exit 0
}

Write-Host "[lint] Running lint:fix..." -ForegroundColor Cyan
docker compose run --rm app npm run lint:fix
if ($LASTEXITCODE -ne 0) { throw "[lint] lint:fix failed." }

Write-Host "[lint] Running lint..." -ForegroundColor Cyan
docker compose run --rm app npm run lint
if ($LASTEXITCODE -ne 0) { throw "[lint] lint failed." }

Write-Host "[lint] Running typecheck..." -ForegroundColor Cyan
docker compose run --rm app npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "[lint] typecheck failed." }
