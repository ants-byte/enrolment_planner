$ErrorActionPreference = 'Stop'
$taskToolDirectory = Join-Path $env:LOCALAPPDATA 'SubjectPlanner\tunnel-client'
$taskTunnelExecutable = Get-ChildItem -LiteralPath $taskToolDirectory -Filter tunnel-client.exe -Recurse |
    Select-Object -First 1 -ExpandProperty FullName
if (!$taskTunnelExecutable) { throw 'The OpenAI tunnel client is not installed.' }
Write-Host 'Paste your OpenAI tunnel runtime API key below. Input is hidden and is not saved.'
Write-Host 'The key needs Tunnels Read + Use in the organisation that owns your tunnel.'
$taskSecureKey = Read-Host 'Tunnel runtime API key' -AsSecureString
$taskKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecureKey)
try {
    $env:CONTROL_PLANE_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskKeyPointer)
    & $taskTunnelExecutable doctor --profile subject-planner-local --explain
    if ($LASTEXITCODE -ne 0) { throw 'Tunnel checks failed. Review the diagnostic above; do not share the API key.' }
    Write-Host 'Keep this terminal open while using Subject Planner Local in ChatGPT. Ctrl+C stops the tunnel.'
    & $taskTunnelExecutable run --profile subject-planner-local
} finally {
    Remove-Item Env:CONTROL_PLANE_API_KEY -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskKeyPointer)
    $taskSecureKey.Dispose()
}
