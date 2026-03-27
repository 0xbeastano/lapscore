[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "Restarting as Administrator..." -ForegroundColor Cyan
  Start-Process powershell.exe -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
  exit
}

Write-Host "LapScore — Free PC Monitoring System" -ForegroundColor Cyan

$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "Node.js is required but not installed." -ForegroundColor Red
    exit 1
}

$nodeVersion = (node --version).TrimStart('v')
$nodeMajor = [int]($nodeVersion.Split('.')[0])
$nodeMinor = [int]($nodeVersion.Split('.')[1])

$nodeOk = ($nodeMajor -eq 20 -and $nodeMinor -ge 19) -or
          ($nodeMajor -eq 22 -and $nodeMinor -ge 12) -or
          ($nodeMajor -gt 22)

if (-not $nodeOk) {
  Write-Host ""
  Write-Host "  WARNING: Node.js $nodeVersion may be too old for Vite." -ForegroundColor Yellow
  Write-Host "  Recommended: upgrade to Node.js 22.12.0+" -ForegroundColor Yellow
  Write-Host "  Attempting build anyway..." -ForegroundColor Gray
}

Write-Host "Starting system scan..." -ForegroundColor Cyan
$collectorPath = Join-Path $PSScriptRoot "scripts\collector.ps1"
& $collectorPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "Scan failed." -ForegroundColor Red
    exit 1
}
Write-Host "Scan complete." -ForegroundColor Green

if (-not (Test-Path "$PSScriptRoot\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Push-Location $PSScriptRoot
    npm install --silent
    Pop-Location
}

Write-Host "Building dashboard..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot"
$buildOutput = npm run build 2>&1
$buildExitCode = $LASTEXITCODE

if ($buildExitCode -ne 0) {
  if ($buildOutput -match "Node.js version" -or $buildOutput -match "requires Node") {
    Write-Host ""
    Write-Host "  BUILD FAILED: Node.js version is too old." -ForegroundColor Red
    Write-Host "  Your version: $(node --version)" -ForegroundColor Yellow
    Write-Host "  Required: Node.js 20.19+ or 22.12+" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Quick fix: upgrade Node.js." -ForegroundColor Cyan
  } else {
    Write-Host "  BUILD FAILED." -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor Gray
  }
  exit 1
}

Write-Host "Dashboard built successfully." -ForegroundColor Green
Set-Location $PSScriptRoot

$portCheck = netstat -ano | findstr ":7821"
if ($portCheck) {
    Write-Host "LapScore server already running." -ForegroundColor Yellow
    $serverRunning = $true
} else {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    $server = Start-Process $nodeCmd.Source -ArgumentList "server/index.js" -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden
    $serverRunning = $false
    Write-Host "Starting server..." -ForegroundColor Gray
    Start-Sleep -Seconds 6
}

try {
    Invoke-RestMethod -Uri "http://localhost:7821/api/scan/ingest" -Method Post
} catch {}

Start-Process "http://localhost:7821"

Write-Host "LapScore is running at http://localhost:7821" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray

if (-not $serverRunning) {
    try {
        Wait-Process -Id $server.Id -ErrorAction SilentlyContinue
    } finally {
        if ($server -and -not $server.HasExited) {
            Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
            Write-Host "LapScore server stopped."
        }
    }
} else {
    while ($true) { Start-Sleep 60 }
}
