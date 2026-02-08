$ErrorActionPreference = 'Stop'

$baseKey = 'HKCU:\Software\Classes\enrol'
if (Test-Path -LiteralPath $baseKey) {
  Remove-Item -LiteralPath $baseKey -Recurse -Force
  Write-Host 'Removed protocol handler: enrol://'
} else {
  Write-Host 'Protocol handler not installed.'
}
