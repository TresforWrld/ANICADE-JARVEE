param(
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $Root

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

$NpxCommand = Get-Command npx.cmd -ErrorAction SilentlyContinue
if (-not $NpxCommand) {
  $NpxCommand = Get-Command npx -ErrorAction SilentlyContinue
}

if ($NpxCommand) {
  Start-Process -FilePath $NpxCommand.Source -ArgumentList @("--yes", "http-server", ".", "-p", "$SelectedPort", "-c-1") -WorkingDirectory $Root -WindowStyle Hidden
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  Start-Process -FilePath "python" -ArgumentList @("-m", "http.server", "$SelectedPort") -WorkingDirectory $Root -WindowStyle Hidden
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  Start-Process -FilePath "py" -ArgumentList @("-m", "http.server", "$SelectedPort") -WorkingDirectory $Root -WindowStyle Hidden
} else {
  Write-Host "ANICADE JARVIS needs Node.js or Python to run locally."
  Write-Host "Install Node.js from https://nodejs.org, then run this file again."
  Start-Process "https://nodejs.org"
  exit 1
}

Start-Sleep -Seconds 2
Start-Process $Url
Write-Host "ANICADE JARVIS is running at $Url"
