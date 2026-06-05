param(
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $Root

$ConfigPath = Join-Path $Root "config.js"
$ExamplePath = Join-Path $Root "config.example.js"
if (-not (Test-Path -LiteralPath $ConfigPath)) {
  Write-Host ""
  Write-Warning "config.js was not found. The app will fall back to config.example.js (placeholder keys only — no real API access)."
  Write-Host "  Run .\install.ps1  or copy config.example.js to config.js, then add your keys."
  Write-Host ""
}

function Test-PortAvailable {
  param([int]$CandidatePort)
  $listener = $null
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $CandidatePort)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($listener) { $listener.Stop() }
  }
}

$SelectedPort = $Port
while (-not (Test-PortAvailable -CandidatePort $SelectedPort)) {
  $SelectedPort++
  if ($SelectedPort -gt ($Port + 99)) {
    throw "No free local port found between $Port and $($Port + 99)."
  }
}

$Url = "http://127.0.0.1:$SelectedPort/index.html"

$NodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $NodeCommand) {
  $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
}

if ($NodeCommand) {
  Start-Process -FilePath $NodeCommand.Source -ArgumentList @("local-server.js", "$SelectedPort") -WorkingDirectory $Root -WindowStyle Hidden
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  Start-Process -FilePath "python" -ArgumentList @("-m", "http.server", "$SelectedPort") -WorkingDirectory $Root -WindowStyle Hidden
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  Start-Process -FilePath "py" -ArgumentList @("-m", "http.server", "$SelectedPort") -WorkingDirectory $Root -WindowStyle Hidden
} else {
  Write-Host "ANICADE Voice Assistant needs Node.js or Python to run locally."
  Write-Host "Install Node.js from https://nodejs.org, then run this file again."
  Start-Process "https://nodejs.org"
  exit 1
}

Start-Sleep -Seconds 2
Start-Process $Url
Write-Host "ANICADE Voice Assistant is running at $Url"
