param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Uri
)

$ErrorActionPreference = 'Stop'

function Get-ParsedUri {
  param([string]$RawUri)
  if ([string]::IsNullOrWhiteSpace($RawUri)) { return $null }
  try {
    return [System.Uri]$RawUri
  } catch {
    return $null
  }
}

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

function Normalize-WindowsTargetPath {
  param([string]$Value)
  $target = [string]$Value
  if ([string]::IsNullOrWhiteSpace($target)) { return '' }
  $target = $target.Trim()
  if ($target -match '^/[A-Za-z]:\\') {
    $target = $target.Substring(1)
  }
  if ($target -match '^[A-Za-z]:/') {
    $target = $target -replace '/', '\'
  }
  if ($target.StartsWith('//')) {
    $target = $target -replace '/', '\'
  }
  if ($target -match '^\\[^\\]') {
    $target = "\$target"
  }
  if ($target -notmatch '^[A-Za-z]:\\' -and -not $target.StartsWith('\\')) {
    return ''
  }
  return $target
}

function Resolve-QueryPath {
  param(
    [System.Uri]$ParsedUri,
    [string]$Name
  )
  if ($null -eq $ParsedUri) { return '' }
  $raw = Get-QueryValue -Query $ParsedUri.Query -Name $Name
  if (-not $raw) { return '' }
  return Normalize-WindowsTargetPath -Value $raw
}

function Resolve-TargetPath {
  param([System.Uri]$ParsedUri)
  if ($null -eq $ParsedUri) { return '' }

  $path = Resolve-QueryPath -ParsedUri $ParsedUri -Name 'path'
  if ($path) { return $path }

  try {
    $fallback = [System.Uri]::UnescapeDataString($ParsedUri.AbsolutePath.TrimStart('/'))
  } catch {
    $fallback = $ParsedUri.AbsolutePath.TrimStart('/')
  }
  if (-not $fallback) { return '' }

  return Normalize-WindowsTargetPath -Value $fallback
}

function Resolve-WildcardTargetPath {
  param([string]$PathValue)
  $path = [string]$PathValue
  if ([string]::IsNullOrWhiteSpace($path)) { return '' }
  if ($path -notmatch '[*?]') { return $path }

  $lastSlash = [Math]::Max($path.LastIndexOf('\'), $path.LastIndexOf('/'))
  if ($lastSlash -lt 0) { return $path }

  $parent = $path.Substring(0, $lastSlash)
  $leafPattern = $path.Substring($lastSlash + 1)
  if ([string]::IsNullOrWhiteSpace($parent) -or [string]::IsNullOrWhiteSpace($leafPattern)) {
    return $path
  }

  # Expected input: "<studentId>*"
  if (-not $leafPattern.EndsWith('*')) { return $path }
  $prefix = $leafPattern.TrimEnd('*')
  if ([string]::IsNullOrWhiteSpace($prefix)) { return $path }
  if (-not (Test-Path -LiteralPath $parent -PathType Container)) { return $path }

  $match = Get-ChildItem -LiteralPath $parent -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "$prefix*" } |
    Sort-Object Name |
    Select-Object -First 1

  if ($null -ne $match -and $match.FullName) {
    return [string]$match.FullName
  }

  # No student subfolder match; open the teacher temp folder.
  return $parent
}

function Ensure-ParentDirectory {
  param([string]$PathValue)
  if ([string]::IsNullOrWhiteSpace($PathValue)) { return }
  $parent = Split-Path -Path $PathValue -Parent
  if ($parent -and -not (Test-Path -LiteralPath $parent -PathType Container)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }
}

function Get-UniquePath {
  param([string]$PathValue)
  $raw = [string]$PathValue
  if ([string]::IsNullOrWhiteSpace($raw)) { return '' }
  if (-not (Test-Path -LiteralPath $raw)) { return $raw }

  $parent = Split-Path -Path $raw -Parent
  if (-not $parent) { return $raw }
  $leaf = Split-Path -Path $raw -Leaf
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($leaf)
  $extension = [System.IO.Path]::GetExtension($leaf)
  if ([string]::IsNullOrWhiteSpace($baseName)) {
    $baseName = $leaf
    $extension = ''
  }

  for ($i = 2; $i -le 9999; $i++) {
    $candidateLeaf = if ($extension) { "$baseName ($i)$extension" } else { "$baseName ($i)" }
    $candidate = Join-Path $parent $candidateLeaf
    if (-not (Test-Path -LiteralPath $candidate)) {
      return $candidate
    }
  }

  return $raw
}

function PathsEqual {
  param(
    [string]$A,
    [string]$B
  )
  $left = [string]$A
  $right = [string]$B
  if ([string]::IsNullOrWhiteSpace($left) -or [string]::IsNullOrWhiteSpace($right)) {
    return $false
  }
  $left = $left.Trim().TrimEnd('\')
  $right = $right.Trim().TrimEnd('\')
  return [string]::Equals($left, $right, [System.StringComparison]::OrdinalIgnoreCase)
}

function Set-WordTableCellText {
  param(
    [Parameter(Mandatory = $true)]$Table,
    [Parameter(Mandatory = $true)][int]$Row,
    [Parameter(Mandatory = $true)][int]$Column,
    [string]$Value
  )
  try {
    $cell = $Table.Cell($Row, $Column)
    if ($null -eq $cell) { return }
    $text = [string]$Value
    $text = $text -replace "(\r\n|\r|\n)", ' '
    $range = $cell.Range
    if ($null -eq $range) { return }
    if ($range.End -gt $range.Start) {
      $range.End = $range.End - 1
    }
    $range.Text = $text
  } catch {
    # Ignore missing/misaligned table cells.
  }
}

function Invoke-CreditFormWordAutofill {
  param(
    [string]$FilePath,
    [hashtable]$Values
  )
  if ([string]::IsNullOrWhiteSpace($FilePath)) { return $false }
  if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) { return $false }
  $ext = [System.IO.Path]::GetExtension($FilePath)
  if (-not [string]::Equals($ext, '.docx', [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
  if ($null -eq $Values) { return $false }

  $candidateValues = @(
    [string]$Values.StudentId,
    [string]$Values.Dob,
    [string]$Values.International,
    [string]$Values.FamilyName,
    [string]$Values.GivenName,
    [string]$Values.Email,
    [string]$Values.Mobile
  )
  $hasAnyValue = $false
  foreach ($candidate in $candidateValues) {
    if (-not [string]::IsNullOrWhiteSpace($candidate)) {
      $hasAnyValue = $true
      break
    }
  }
  if (-not $hasAnyValue) { return $false }

  $word = $null
  $doc = $null
  $table = $null
  try {
    $word = New-Object -ComObject Word.Application
    if ($null -eq $word) { return $false }
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open($FilePath)
    if ($null -eq $doc) { return $false }
    if ($doc.Tables.Count -lt 1) { return $false }
    $table = $doc.Tables.Item(1)

    # Top page-1 table mapping in Credit (HE) Form template.
    Set-WordTableCellText -Table $table -Row 2 -Column 2 -Value $Values.StudentId
    Set-WordTableCellText -Table $table -Row 2 -Column 6 -Value $Values.Dob
    Set-WordTableCellText -Table $table -Row 2 -Column 8 -Value $Values.International
    Set-WordTableCellText -Table $table -Row 3 -Column 2 -Value $Values.FamilyName
    Set-WordTableCellText -Table $table -Row 3 -Column 4 -Value $Values.GivenName
    Set-WordTableCellText -Table $table -Row 5 -Column 4 -Value $Values.Email
    Set-WordTableCellText -Table $table -Row 5 -Column 2 -Value $Values.Mobile

    $doc.Save()
    return $true
  } catch {
    return $false
  } finally {
    if ($null -ne $doc) {
      try { $doc.Close() } catch {}
    }
    if ($null -ne $word) {
      try { $word.Quit() } catch {}
    }
    foreach ($comObject in @($table, $doc, $word)) {
      if ($null -eq $comObject) { continue }
      try {
        if ([System.Runtime.InteropServices.Marshal]::IsComObject($comObject)) {
          [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($comObject)
        }
      } catch {
        # Ignore COM release errors.
      }
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
  }
}

$parsedUri = Get-ParsedUri -RawUri $Uri
if ($null -eq $parsedUri) { exit 1 }

$targetPath = Resolve-TargetPath -ParsedUri $parsedUri
$selectPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'select'
$selectFallbackPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'selectFallback'
$mkdirPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'mkdir'
$mkdirFallbackPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'mkdirFallback'
$copyFromPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'copyFrom'
$copyFromFallbackPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'copyFromFallback'
$copyToPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'copyTo'
$copyToFallbackPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'copyToFallback'
$renameFromPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'renameFrom'
$renameToPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'renameTo'
$overwriteRaw = Get-QueryValue -Query $parsedUri.Query -Name 'overwrite'
$overwrite = [bool]($overwriteRaw -match '^(1|true|yes|y)$')
$openFileRaw = Get-QueryValue -Query $parsedUri.Query -Name 'openFile'
$openFile = [bool]($openFileRaw -match '^(1|true|yes|y)$')
$studentIdText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'sid')).Trim()
$dobText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'dob')).Trim()
$internationalText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'intl')).Trim()
$familyNameText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'family')).Trim()
$givenNameText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'given')).Trim()
$emailText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'email')).Trim()
$mobileText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'mobile')).Trim()
$creditFormWordFields = @{
  StudentId = $studentIdText
  Dob = $dobText
  International = $internationalText
  FamilyName = $familyNameText
  GivenName = $givenNameText
  Email = $emailText
  Mobile = $mobileText
}

$effectiveMkdirPath = ''
$effectiveCopyToPath = ''
$effectiveRenameToPath = ''
$copySourcePath = ''

if ($mkdirPath -or $mkdirFallbackPath) {
  $mkdirTarget = ''
  if ($mkdirPath -and $mkdirFallbackPath) {
    $mkdirParent = Split-Path -Path $mkdirPath -Parent
    if ($mkdirParent -and (Test-Path -LiteralPath $mkdirParent -PathType Container)) {
      $mkdirTarget = $mkdirPath
    } else {
      $mkdirTarget = $mkdirFallbackPath
    }
  } elseif ($mkdirPath) {
    $mkdirTarget = $mkdirPath
  } else {
    $mkdirTarget = $mkdirFallbackPath
  }

  if ($mkdirTarget) {
    New-Item -ItemType Directory -Path $mkdirTarget -Force | Out-Null
    $effectiveMkdirPath = $mkdirTarget
    if (-not $targetPath) {
      $targetPath = $mkdirTarget
    }
  }
}

if (($copyFromPath -or $copyFromFallbackPath) -and ($copyToPath -or $copyToFallbackPath)) {
  if ($copyFromPath -and (Test-Path -LiteralPath $copyFromPath -PathType Leaf)) {
    $copySourcePath = $copyFromPath
  } elseif ($copyFromFallbackPath -and (Test-Path -LiteralPath $copyFromFallbackPath -PathType Leaf)) {
    $copySourcePath = $copyFromFallbackPath
  }
}

if ($copySourcePath -and ($copyToPath -or $copyToFallbackPath)) {
  $copyTargetPath = if ($copyToPath) { $copyToPath } else { $copyToFallbackPath }
  if ($copyToPath -and $copyToFallbackPath) {
    $primaryParent = Split-Path -Path $copyToPath -Parent
    $fallbackParent = Split-Path -Path $copyToFallbackPath -Parent
    if ($effectiveMkdirPath) {
      if (PathsEqual $effectiveMkdirPath $primaryParent) {
        $copyTargetPath = $copyToPath
      } elseif (PathsEqual $effectiveMkdirPath $fallbackParent) {
        $copyTargetPath = $copyToFallbackPath
      }
    } else {
      $teacherParent = if ($primaryParent) { Split-Path -Path $primaryParent -Parent } else { '' }
      if ($teacherParent -and (Test-Path -LiteralPath $teacherParent -PathType Container)) {
        $copyTargetPath = $copyToPath
      } else {
        $copyTargetPath = $copyToFallbackPath
      }
    }
  }

  Ensure-ParentDirectory -PathValue $copyTargetPath
  if (-not ((Test-Path -LiteralPath $copyTargetPath -PathType Leaf) -and -not $overwrite)) {
    Copy-Item -LiteralPath $copySourcePath -Destination $copyTargetPath -Force
  }
  $effectiveCopyToPath = $copyTargetPath
  if (-not $targetPath) {
    $targetPath = Split-Path -Path $copyTargetPath -Parent
  }
}

if ($renameFromPath -and $renameToPath -and (Test-Path -LiteralPath $renameFromPath)) {
  $renameTargetPath = $renameToPath
  Ensure-ParentDirectory -PathValue $renameTargetPath
  if ((Test-Path -LiteralPath $renameTargetPath) -and -not $overwrite) {
    $renameTargetPath = Get-UniquePath -PathValue $renameTargetPath
  }
  Move-Item -LiteralPath $renameFromPath -Destination $renameTargetPath -Force
  $effectiveRenameToPath = $renameTargetPath
  if (-not $targetPath) {
    $targetPath = Split-Path -Path $renameTargetPath -Parent
  }
}

if ($effectiveRenameToPath) {
  $selectPath = $effectiveRenameToPath
} elseif ($effectiveCopyToPath) {
  $selectPath = $effectiveCopyToPath
} elseif ($selectPath -and -not (Test-Path -LiteralPath $selectPath) -and $selectFallbackPath -and (Test-Path -LiteralPath $selectFallbackPath)) {
  $selectPath = $selectFallbackPath
}

if (-not $selectPath -and $selectFallbackPath -and (Test-Path -LiteralPath $selectFallbackPath)) {
  $selectPath = $selectFallbackPath
}

if ($selectPath -and -not (Test-Path -LiteralPath $selectPath)) {
  $selectPath = ''
}

if ($selectPath -and (Test-Path -LiteralPath $selectPath -PathType Leaf)) {
  $null = Invoke-CreditFormWordAutofill -FilePath $selectPath -Values $creditFormWordFields
}

if (-not $targetPath -and $selectPath) {
  $targetPath = Split-Path -Path $selectPath -Parent
}

if (-not $targetPath -and -not $selectPath) { exit 1 }

$launchPath = Resolve-WildcardTargetPath -PathValue $targetPath
if ([string]::IsNullOrWhiteSpace($launchPath)) { exit 1 }

if (-not (Test-Path -LiteralPath $launchPath)) {
  $parent = Split-Path -Path $launchPath -Parent
  if ($parent -and (Test-Path -LiteralPath $parent -PathType Container)) {
    $launchPath = $parent
  }
}

if (-not (Test-Path -LiteralPath $launchPath -PathType Container)) {
  $parent = Split-Path -Path $launchPath -Parent
  if ($parent -and (Test-Path -LiteralPath $parent -PathType Container)) {
    $launchPath = $parent
  }
}

if ($selectPath) {
  $selectArg = "/select,`"$selectPath`""
  Start-Process -FilePath 'explorer.exe' -ArgumentList $selectArg | Out-Null
  if ($openFile -and (Test-Path -LiteralPath $selectPath -PathType Leaf)) {
    Start-Process -FilePath $selectPath | Out-Null
  }
  exit 0
}

Start-Process -FilePath 'explorer.exe' -ArgumentList $launchPath | Out-Null
exit 0
