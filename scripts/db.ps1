[CmdletBinding()]
param(
  [ValidateSet('status', 'migrations', 'counts', 'vehicles', 'sql')]
  [string]$Action = 'status',
  [string]$Database,
  [string]$Sql,
  [int]$Top = 20,
  [string]$DbPassword
)

$ErrorActionPreference = 'Stop'

function Get-DotEnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  if (-not (Test-Path '.env')) {
    return $null
  }

  $line = Get-Content '.env' | Where-Object {
    $_ -match "^\s*$Key\s*=" -and -not $_.TrimStart().StartsWith('#')
  } | Select-Object -First 1

  if (-not $line) {
    return $null
  }

  return (($line -split '=', 2)[1]).Trim().Trim('"')
}

function Resolve-DbPassword {
  if ($DbPassword) {
    return $DbPassword
  }

  if ($env:DB_PASSWORD) {
    return $env:DB_PASSWORD
  }

  return Get-DotEnvValue -Key 'DB_PASSWORD'
}

function Resolve-Database {
  if ($Database) {
    return $Database
  }

  if ($env:DB_DATABASE) {
    return $env:DB_DATABASE
  }

  return (Get-DotEnvValue -Key 'DB_DATABASE')
}

function Invoke-Sql {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Query
  )

  $password = Resolve-DbPassword
  $dbName = Resolve-Database

  if (-not $password) {
    throw '[db] Could not resolve DB password. Set DB_PASSWORD in environment, .env, or pass -DbPassword.'
  }

  if (-not $dbName) {
    $dbName = 'aivacol_db'
  }

  $escapedQuery = $Query.Replace('"', '""')
  $command = "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"$password\" -d \"$dbName\" -C -Q \"$escapedQuery\""
  docker compose exec -T sqlserver sh -lc $command

  if ($LASTEXITCODE -ne 0) {
    throw "[db] SQL command failed for action '$Action'."
  }
}

switch ($Action) {
  'status' {
    Write-Host '[db] SQL Server status/version' -ForegroundColor Cyan
    Invoke-Sql -Query "SELECT @@SERVERNAME AS server_name, DB_NAME() AS database_name, @@VERSION AS sqlserver_version;"
  }
  'migrations' {
    Write-Host '[db] Latest migrations' -ForegroundColor Cyan
    Invoke-Sql -Query "SELECT id, timestamp, name FROM migrations ORDER BY timestamp DESC;"
  }
  'counts' {
    Write-Host '[db] Entity counts (active rows)' -ForegroundColor Cyan
    Invoke-Sql -Query @"
SELECT 'users' AS entity, COUNT(1) AS total FROM users WHERE deleted_at IS NULL
UNION ALL
SELECT 'brands' AS entity, COUNT(1) AS total FROM brands WHERE deleted_at IS NULL
UNION ALL
SELECT 'models' AS entity, COUNT(1) AS total FROM models WHERE deleted_at IS NULL
UNION ALL
SELECT 'vehicles' AS entity, COUNT(1) AS total FROM vehicles WHERE deleted_at IS NULL;
"@
  }
  'vehicles' {
    Write-Host "[db] Top $Top vehicles (latest created)" -ForegroundColor Cyan
    Invoke-Sql -Query @"
SELECT TOP ($Top)
  v.id,
  v.license_plate,
  v.chassis,
  v.renavam,
  v.[year],
  m.[name] AS model_name,
  b.[name] AS brand_name,
  v.created_at,
  v.updated_at
FROM vehicles v
INNER JOIN models m ON m.id = v.model_id
INNER JOIN brands b ON b.id = m.brand_id
WHERE v.deleted_at IS NULL
ORDER BY v.created_at DESC;
"@
  }
  'sql' {
    if (-not $Sql) {
      throw "[db] Action 'sql' requires -Sql \"SELECT ...\""
    }

    Write-Host '[db] Running custom SQL' -ForegroundColor Cyan
    Invoke-Sql -Query $Sql
  }
}
