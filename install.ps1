# First-time setup for ANICADE Voice Assistant (GitHub ZIP or clone).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $Root

Write-Host "ANICADE Voice Assistant — setup"
Write-Host ""

$NodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $NodeCommand) {
  $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
}
if (-not $NodeCommand) {
  Write-Host "Node.js is required. Install from https://nodejs.org (LTS), then run this script again."
  Start-Process "https://nodejs.org"
  exit 1
}

& $NodeCommand.Source --version | ForEach-Object { Write-Host "Node.js $_" }

$ConfigPath = Join-Path $Root "config.js"
$ExamplePath = Join-Path $Root "config.example.js"
if (-not (Test-Path -LiteralPath $ConfigPath)) {
  if (-not (Test-Path -LiteralPath $ExamplePath)) {
    throw "Missing config.example.js in project folder."
  }
  Copy-Item -LiteralPath $ExamplePath -Destination $ConfigPath
  Write-Host "Created config.js from config.example.js."
} else {
  Write-Host "config.js already exists — left unchanged."
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Edit config.js and add API keys you need (optional for basic voice UI)."
Write-Host "  2. Start the app:  .\start-anicade.ps1   or   npm start"
Write-Host "  3. Open http://127.0.0.1:8000/index.html in Chrome or Edge."
Write-Host ""

$Launch = Read-Host "Start the local server now? (Y/n)"
if ($Launch -eq "" -or $Launch -match '^[Yy]') {
  & (Join-Path $Root "start-anicade.ps1")
}
