$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcherPath = Join-Path $scriptDir 'enrol-protocol-launcher.ps1'

if (-not (Test-Path -LiteralPath $launcherPath)) {
  throw "Launcher script not found: $launcherPath"
}

$powerShellExe = Join-Path $PSHOME 'powershell.exe'
$baseKey = 'HKCU:\Software\Classes\enrol'
$commandKey = Join-Path $baseKey 'shell\open\command'

New-Item -Path $commandKey -Force | Out-Null
Set-ItemProperty -Path $baseKey -Name '(Default)' -Value 'URL:Enrol Protocol' -Force
New-ItemProperty -Path $baseKey -Name 'URL Protocol' -PropertyType String -Value '' -Force | Out-Null

$command = "`"$powerShellExe`" -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$launcherPath`" `"%1`""
Set-ItemProperty -Path $commandKey -Name '(Default)' -Value $command -Force

Write-Host 'Installed protocol handler: enrol://'
Write-Host "Command: $command"
Write-Host 'You may need to restart the browser.'
