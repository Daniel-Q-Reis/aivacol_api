[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "[dev] Building and starting containers..." -ForegroundColor Cyan
docker compose up --build -d

if ($LASTEXITCODE -ne 0) {
  throw "[dev] docker compose up failed."
}

Write-Host "[dev] Infrastructure is up." -ForegroundColor Green
docker compose ps
