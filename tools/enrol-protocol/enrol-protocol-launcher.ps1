param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Uri
)

$ErrorActionPreference = 'Stop'

function Get-QueryValue {
  param(
    [string]$Query,
    [string]$Name
  )
  if ([string]::IsNullOrWhiteSpace($Query)) { return '' }
  $parts = $Query.TrimStart('?').Split('&')
  foreach ($pair in $parts) {
    if ([string]::IsNullOrWhiteSpace($pair)) { continue }
    $kv = $pair.Split('=', 2)
    if ($kv.Length -lt 2) { continue }
    if ($kv[0].Trim().ToLowerInvariant() -eq $Name.ToLowerInvariant()) {
      try {
        return [System.Uri]::UnescapeDataString($kv[1])
      } catch {
        return $kv[1]
      }
    }
  }
  return ''
}

function Resolve-TargetPath {
  param([string]$RawUri)
  if ([string]::IsNullOrWhiteSpace($RawUri)) { return '' }
  try {
    $parsed = [System.Uri]$RawUri
  } catch {
    return ''
  }

  $path = Get-QueryValue -Query $parsed.Query -Name 'path'
  if (-not $path) {
    try {
      $path = [System.Uri]::UnescapeDataString($parsed.AbsolutePath.TrimStart('/'))
    } catch {
      $path = $parsed.AbsolutePath.TrimStart('/')
    }
  }
  if (-not $path) { return '' }

  $target = $path.Trim()
  if ($target -match '^/[A-Za-z]:\\') {
    $target = $target.Substring(1)
  }
  if ($target -match '^[A-Za-z]:/') {
    $target = $target -replace '/', '\'
  }
  if ($target.StartsWith('//')) {
    $target = $target -replace '/', '\'
  }
  return $target
}

$targetPath = Resolve-TargetPath -RawUri $Uri
if ([string]::IsNullOrWhiteSpace($targetPath)) { exit 1 }

if ($targetPath -notmatch '^[A-Za-z]:\\' -and -not $targetPath.StartsWith('\\')) {
  exit 1
}

Start-Process -FilePath 'explorer.exe' -ArgumentList $targetPath | Out-Null
exit 0
