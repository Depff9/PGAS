param(
  [Parameter(Mandatory = $true)]
  [string]$DumpFile,
  [string]$Host = "localhost",
  [int]$Port = 5432,
  [string]$Database = "pgas_system",
  [string]$User = "postgres"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DumpFile)) {
  throw "Dump file not found: $DumpFile"
}

Write-Host "Restoring backup from $DumpFile to $Database"

pg_restore `
  --host=$Host `
  --port=$Port `
  --username=$User `
  --dbname="$Database" `
  --clean `
  --if-exists `
  "$DumpFile"

Write-Host "Restore completed"
