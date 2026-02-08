$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $scriptRoot 'tools\enrol-protocol\install-enrol-protocol.ps1'

if (-not (Test-Path -LiteralPath $target)) {
  throw "Cannot find target script: $target"
}

& powershell -NoProfile -ExecutionPolicy Bypass -File $target
