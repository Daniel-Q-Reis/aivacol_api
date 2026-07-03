[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "[stop] Stopping containers..." -ForegroundColor Yellow
docker compose down --remove-orphans

if ($LASTEXITCODE -ne 0) {
  throw "[stop] docker compose down failed."
}

Write-Host "[stop] Containers stopped." -ForegroundColor Green
