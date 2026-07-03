[CmdletBinding()]
param(
  [string]$BaseUrl = $(if ($env:BENCHMARK_BASE_URL) { $env:BENCHMARK_BASE_URL } else { "http://app:3000" })
)

$ErrorActionPreference = "Stop"

Write-Host "[benchmark] Running benchmark in dedicated tools profile..." -ForegroundColor Cyan
docker compose --profile tools run --rm -e BENCHMARK_BASE_URL=$BaseUrl benchmark-runner npx -y -p tsx -p autocannon tsx scripts/benchmark.ts

if ($LASTEXITCODE -ne 0) {
  throw "[benchmark] benchmark execution failed."
}
