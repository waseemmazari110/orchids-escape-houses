# CRM Tables Creation Script for Turso
# This script safely creates CRM tables without modifying existing ones

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRM Tables Creation for Turso" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Error: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please ensure you have TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, [EnvironmentVariableTarget]::Process)
    }
}

$tursoUrl = $env:TURSO_CONNECTION_URL
$tursoToken = $env:TURSO_AUTH_TOKEN

if ([string]::IsNullOrWhiteSpace($tursoUrl) -or [string]::IsNullOrWhiteSpace($tursoToken)) {
    Write-Host "❌ Error: Missing Turso credentials!" -ForegroundColor Red
    Write-Host "Please set TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN in .env.local" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Turso credentials loaded" -ForegroundColor Green
Write-Host "📄 Reading SQL migration file..." -ForegroundColor Cyan

$sqlContent = Get-Content "create_crm_tables_safe.sql" -Raw

# Split SQL into individual statements
$statements = $sqlContent -split ';' | Where-Object { $_.Trim() -ne '' -and $_.Trim() -notmatch '^--' }

Write-Host "📊 Found $($statements.Count) SQL statements to execute" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  This will create CRM tables in your Turso database" -ForegroundColor Yellow
Write-Host "⚠️  NO existing tables will be modified" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
$null = Read-Host

Write-Host ""
Write-Host "🚀 Creating CRM tables..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$errorCount = 0

# Execute SQL via Turso CLI if available, otherwise use HTTP API
if (Get-Command "turso" -ErrorAction SilentlyContinue) {
    Write-Host "Using Turso CLI..." -ForegroundColor Green
    
    # Extract database name from URL
    $dbName = ($tursoUrl -split '//')[1] -replace '\.turso\.io.*', ''
    
    # Write SQL to temp file
    $tempFile = "temp_migration.sql"
    $sqlContent | Out-File -FilePath $tempFile -Encoding UTF8
    
    # Execute via Turso CLI
    turso db shell $dbName < $tempFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CRM tables created successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Error executing SQL" -ForegroundColor Red
    }
    
    # Clean up
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
} else {
    Write-Host "⚠️  Turso CLI not found. Please install it:" -ForegroundColor Yellow
    Write-Host "   npm install -g @turso/cli" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or run this SQL file manually:" -ForegroundColor Yellow
    Write-Host "   turso db shell <your-db-name> < create_crm_tables_safe.sql" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run this to verify CRM tables:" -ForegroundColor Yellow
Write-Host "  turso db shell <your-db-name> \"SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'crm_%' ORDER BY name;\"" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected tables:" -ForegroundColor Yellow
Write-Host "  - crm_activity_log" -ForegroundColor Gray
Write-Host "  - crm_contacts" -ForegroundColor Gray
Write-Host "  - crm_enquiries" -ForegroundColor Gray
Write-Host "  - crm_interactions" -ForegroundColor Gray
Write-Host "  - crm_memberships" -ForegroundColor Gray
Write-Host "  - crm_properties" -ForegroundColor Gray
Write-Host "  - crm_segments" -ForegroundColor Gray
Write-Host ""
