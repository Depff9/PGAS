param(
  [string]$Host = "localhost",
  [int]$Port = 5432,
  [string]$Database = "pgas_system",
  [string]$User = "postgres",
  [string]$OutputDir = "./backups"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = Join-Path $OutputDir "pgas_system-$timestamp.dump"

Write-Host "Creating backup to $outputFile"

pg_dump `
  --host=$Host `
  --port=$Port `
  --username=$User `
  --format=custom `
  --file="$outputFile" `
  "$Database"

Write-Host "Backup created: $outputFile"
