[CmdletBinding()]
param(
  [string]$BaseUrl = $(if ($env:BENCHMARK_BASE_URL) { $env:BENCHMARK_BASE_URL } else { "http://app:3000" }),
  [ValidateSet("all", "read", "write")]
  [string]$Mode = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "[benchmark] Running benchmark in dedicated tools profile (mode=$Mode)..." -ForegroundColor Cyan

if ($Mode -eq "read") {
  docker compose --profile tools run --rm -e BENCHMARK_BASE_URL=$BaseUrl -e BENCHMARK_RUN_WRITE=false benchmark-runner npx -y -p tsx -p autocannon tsx scripts/benchmark.ts
}
elseif ($Mode -eq "write") {
  docker compose --profile tools run --rm -e BENCHMARK_BASE_URL=$BaseUrl benchmark-runner npx -y -p tsx -p autocannon tsx scripts/benchmark-write.ts
}
else {
  docker compose --profile tools run --rm -e BENCHMARK_BASE_URL=$BaseUrl -e BENCHMARK_RUN_WRITE=false benchmark-runner npx -y -p tsx -p autocannon tsx scripts/benchmark.ts
  if ($LASTEXITCODE -ne 0) {
    throw "[benchmark] read benchmark execution failed."
  }

  docker compose --profile tools run --rm -e BENCHMARK_BASE_URL=$BaseUrl benchmark-runner npx -y -p tsx -p autocannon tsx scripts/benchmark-write.ts
}

if ($LASTEXITCODE -ne 0) {
  throw "[benchmark] benchmark execution failed."
}
