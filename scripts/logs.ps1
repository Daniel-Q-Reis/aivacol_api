[CmdletBinding()]
param(
  [string]$Service = "app"
)

$ErrorActionPreference = "Stop"

Write-Host "[logs] Streaming logs for service '$Service'..." -ForegroundColor Cyan
docker compose logs -f $Service
