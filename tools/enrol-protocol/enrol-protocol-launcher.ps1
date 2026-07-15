param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Uri
)

$ErrorActionPreference = 'Stop'
$CtClipboardDelayMilliseconds = 650

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

function Show-CtDialog {
  param(
    [string]$Title,
    [string]$Message,
    [string[]]$Buttons
  )
  Add-Type -AssemblyName System.Windows.Forms | Out-Null
  Add-Type -AssemblyName System.Drawing | Out-Null
  $form = New-Object System.Windows.Forms.Form
  $form.Text = $Title
  $form.StartPosition = 'CenterScreen'
  $form.Width = 620
  $form.Height = 320
  $form.TopMost = $true
  $label = New-Object System.Windows.Forms.Label
  $label.AutoSize = $false
  $label.Left = 16
  $label.Top = 16
  $label.Width = 570
  $label.Height = 210
  $label.Text = $Message
  $label.Font = New-Object System.Drawing.Font('Segoe UI', 10)
  $form.Controls.Add($label)
  $buttonTop = 235
  $buttonLeft = [Math]::Max(16, 590 - (($Buttons.Count) * 110))
  foreach ($buttonText in $Buttons) {
    $btn = New-Object System.Windows.Forms.Button
    $btn.Text = $buttonText
    $btn.Width = 100
    $btn.Height = 32
    $btn.Left = $buttonLeft
    $btn.Top = $buttonTop
    $btn.Tag = $buttonText
    $btn.Add_Click({
      $form.Tag = $this.Tag
      $form.Close()
    })
    $form.Controls.Add($btn)
    $buttonLeft += 110
  }
  [void]$form.ShowDialog()
  return [string]$form.Tag
}

function Show-CtInfo {
  param([string]$Message, [string]$Title = 'Credit Transfer')
  Add-Type -AssemblyName System.Windows.Forms | Out-Null
  [System.Windows.Forms.MessageBox]::Show($Message, $Title, 'OK', 'Information') | Out-Null
}

function Open-CtPath {
  param([string]$PathValue)
  if ([string]::IsNullOrWhiteSpace($PathValue)) { return }
  if (Test-Path -LiteralPath $PathValue -PathType Container) {
    Start-Process -FilePath 'explorer.exe' -ArgumentList "`"$PathValue`"" | Out-Null
  } elseif (Test-Path -LiteralPath $PathValue -PathType Leaf) {
    Start-Process -FilePath $PathValue | Out-Null
  }
}

function Get-CtFolderClipboardValues {
  param(
    [string]$FolderPath,
    [string]$FallbackStudentId
  )
  $folderName = if ($FolderPath) { Split-Path -Path $FolderPath -Leaf } else { '' }
  if ([string]::IsNullOrWhiteSpace($folderName)) { return @() }

  $studentId = ''
  $nameRemainder = ''
  if ($folderName -match '^\s*([sS]?\d{6,7})(?:[\s_-]+)?(.*)$') {
    $studentId = ([string]$Matches[1]).Trim()
    $nameRemainder = ([string]$Matches[2]).Trim()
  } else {
    $studentId = ([string]$FallbackStudentId).Trim()
    $nameRemainder = $folderName.Trim()
  }
  $nameRemainder = $nameRemainder.Trim(' ', '-', '_')

  $givenOrRemainder = ''
  $family = ''
  if ($nameRemainder -match ',') {
    $parts = $nameRemainder.Split(',', 2)
    $family = ([string]$parts[0]).Trim().ToUpperInvariant()
    $givenOrRemainder = ([string]$parts[1]).Trim()
  } elseif ($nameRemainder -match '^([A-Z][A-Z''-]*(?:\s+[A-Z][A-Z''-]*)*)(?:\s+(.+))?$') {
    $family = ([string]$Matches[1]).Trim().ToUpperInvariant()
    $givenOrRemainder = ([string]$Matches[2]).Trim()
  } else {
    $givenOrRemainder = $nameRemainder
  }

  return @($givenOrRemainder, $family, $studentId, $folderName) |
    Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }
}

function Copy-CtFolderClipboardDetails {
  param(
    [string]$FolderPath,
    [string]$FallbackStudentId
  )
  $values = @(Get-CtFolderClipboardValues -FolderPath $FolderPath -FallbackStudentId $FallbackStudentId)
  foreach ($value in $values) {
    try {
      Set-Clipboard -Value ([string]$value)
      Start-Sleep -Milliseconds $CtClipboardDelayMilliseconds
    } catch {
      return
    }
  }
}

function Get-CtRelativeRootName {
  param(
    [string]$FullPath,
    [string]$RootPath
  )
  $full = ([string]$FullPath).TrimEnd('\')
  $root = ([string]$RootPath).TrimEnd('\')
  if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) { return '' }
  $relative = $full.Substring($root.Length).TrimStart('\')
  if (-not $relative) { return '' }
  return ($relative.Split('\') | Select-Object -First 1)
}

function Get-CtMatches {
  param(
    [string]$RootPath,
    [string]$StudentId,
    [string]$Area,
    [string]$TempRootPath,
    [string]$TeacherTempPath
  )
  $matches = @()
  if ([string]::IsNullOrWhiteSpace($RootPath) -or -not (Test-Path -LiteralPath $RootPath -PathType Container)) {
    return $matches
  }
  $queue = New-Object System.Collections.Generic.Queue[object]
  $queue.Enqueue([pscustomobject]@{ Path = $RootPath; Depth = 0 })
  while ($queue.Count -gt 0) {
    $item = $queue.Dequeue()
    if ($item.Depth -ge 2) { continue }
    $children = Get-ChildItem -LiteralPath $item.Path -Directory -ErrorAction SilentlyContinue
    foreach ($child in $children) {
      $depth = [int]$item.Depth + 1
      $name = [string]$child.Name
      $isMatch = $name.StartsWith($StudentId, [System.StringComparison]::OrdinalIgnoreCase) -or
        ($depth -gt 1 -and $name.IndexOf($StudentId, [System.StringComparison]::OrdinalIgnoreCase) -ge 0)
      if ($isMatch) {
        $teacher = ''
        $inCurrentTeacher = $false
        if ($Area -eq 'temp') {
          $teacher = Get-CtRelativeRootName -FullPath $child.FullName -RootPath $TempRootPath
          $inCurrentTeacher = PathsEqual (Split-Path -Path $child.FullName -Parent) $TeacherTempPath
        }
        $matches += [pscustomobject]@{
          Path = [string]$child.FullName
          Name = $name
          Area = $Area
          Teacher = $teacher
          InCurrentTeacher = $inCurrentTeacher
          Parent = [string](Split-Path -Path $child.FullName -Parent)
        }
      }
      $queue.Enqueue([pscustomobject]@{ Path = [string]$child.FullName; Depth = $depth })
    }
  }
  return $matches
}

function Get-CtLocationLabel {
  param(
    [object]$Match,
    [string]$CreditRoot
  )
  if ($null -eq $Match) { return '' }
  if ($Match.Area -eq 'temp') {
    $teacher = if ($Match.Teacher) { [string]$Match.Teacher } else { 'another teacher' }
    return "Credit folder appears to be in '$teacher's Our temp and working files' folder"
  }
  $creditRootClean = ([string]$CreditRoot).TrimEnd('\')
  $parent = [string]$Match.Parent
  if ($parent -and -not (PathsEqual $parent $creditRootClean)) {
    $subFolder = Split-Path -Path $parent -Leaf
    return "Credit folder is in '$subFolder' within Credit Transfers on SharePoint"
  }
  return "Credit folder is in 'general Credit Transfer folder'"
}

function Get-CtAllMatches {
  param(
    [string]$StudentId,
    [string]$CreditRoot,
    [string]$TempRoot,
    [string]$TeacherTemp
  )
  $creditMatches = @(Get-CtMatches -RootPath $CreditRoot -StudentId $StudentId -Area 'credit' -TempRootPath $TempRoot -TeacherTempPath $TeacherTemp)
  $tempMatches = @(Get-CtMatches -RootPath $TempRoot -StudentId $StudentId -Area 'temp' -TempRootPath $TempRoot -TeacherTempPath $TeacherTemp)
  return @($creditMatches + $tempMatches)
}

function Write-CtStatus {
  param(
    [string]$StatusPath,
    [string]$StudentId,
    [string]$CreditRoot,
    [object[]]$Matches
  )
  if ([string]::IsNullOrWhiteSpace($StatusPath)) { return }
  try {
    Ensure-ParentDirectory -PathValue $StatusPath
    $locations = @($Matches | ForEach-Object {
      [pscustomobject]@{
        path = [string]$_.Path
        label = Get-CtLocationLabel -Match $_ -CreditRoot $CreditRoot
        area = [string]$_.Area
        teacher = [string]$_.Teacher
        inCurrentTeacher = [bool]$_.InCurrentTeacher
      }
    })
    $payload = [pscustomobject]@{
      studentId = $StudentId
      count = $locations.Count
      updatedAt = (Get-Date).ToString('o')
      locations = $locations
    }
    $payload | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $StatusPath -Encoding UTF8
  } catch {
    return
  }
}

function Write-CtStatusForStudent {
  param(
    [string]$StatusPath,
    [string]$StudentId,
    [string]$CreditRoot,
    [string]$TempRoot,
    [string]$TeacherTemp
  )
  $matches = @(Get-CtAllMatches -StudentId $StudentId -CreditRoot $CreditRoot -TempRoot $TempRoot -TeacherTemp $TeacherTemp)
  Write-CtStatus -StatusPath $StatusPath -StudentId $StudentId -CreditRoot $CreditRoot -Matches $matches
}

function Get-CtCreditDoc {
  param(
    [string]$FolderPath,
    [string]$StudentId
  )
  if ([string]::IsNullOrWhiteSpace($FolderPath) -or -not (Test-Path -LiteralPath $FolderPath -PathType Container)) {
    return ''
  }
  $doc = Get-ChildItem -LiteralPath $FolderPath -File -Filter "$StudentId*.docx" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '(?i)credit' } |
    Sort-Object Name |
    Select-Object -First 1
  if ($null -eq $doc) { return '' }
  return [string]$doc.FullName
}

function Ensure-CtCreditDoc {
  param(
    [string]$FolderPath,
    [string]$StudentId,
    [string]$CreditFileName,
    [string]$TemplatePrimary,
    [string]$TemplateFallback
  )
  $existing = Get-CtCreditDoc -FolderPath $FolderPath -StudentId $StudentId
  if ($existing) { return $existing }
  $template = ''
  if ($TemplatePrimary -and (Test-Path -LiteralPath $TemplatePrimary -PathType Leaf)) {
    $template = $TemplatePrimary
  } elseif ($TemplateFallback -and (Test-Path -LiteralPath $TemplateFallback -PathType Leaf)) {
    $template = $TemplateFallback
  }
  if (-not $template) {
    Show-CtInfo -Message "No Credit (HE) template was found.`n`nFind Credit (HE) Form.docx and copy it into:`n$FolderPath"
    return ''
  }
  if (-not (Test-Path -LiteralPath $FolderPath -PathType Container)) {
    New-Item -ItemType Directory -Path $FolderPath -Force | Out-Null
  }
  $target = Join-Path $FolderPath $CreditFileName
  if (Test-Path -LiteralPath $target) {
    $target = Get-UniquePath -PathValue $target
  }
  Copy-Item -LiteralPath $template -Destination $target -Force
  return $target
}

function Invoke-CtTempWorkflow {
  param(
    [string]$StudentId,
    [string]$CreditRoot,
    [string]$TempRoot,
    [string]$TeacherTemp,
    [string]$TeacherName,
    [string]$StudentFolderName,
    [string]$CreditFileName,
    [string]$TemplatePrimary,
    [string]$TemplateFallback,
    [string]$StatusPath
  )
  if (-not $StudentId -or -not $CreditRoot -or -not $TempRoot -or -not $TeacherTemp) {
    Show-CtInfo -Message 'Cannot run ct -> temp because required folder paths were not supplied.'
    return
  }
  if (-not (Test-Path -LiteralPath $TeacherTemp -PathType Container)) {
    New-Item -ItemType Directory -Path $TeacherTemp -Force | Out-Null
  }

  $matches = @(Get-CtAllMatches -StudentId $StudentId -CreditRoot $CreditRoot -TempRoot $TempRoot -TeacherTemp $TeacherTemp)
  Write-CtStatus -StatusPath $StatusPath -StudentId $StudentId -CreditRoot $CreditRoot -Matches $matches

  if ($matches.Count -ge 2) {
    $list = ($matches | ForEach-Object { "    $($_.Path)" }) -join "`n`n"
    $choice = Show-CtDialog -Title 'Multiple credit-transfer folders found' -Buttons @('Go', 'Cancel') -Message (
      "There should only be one source of truth for this student.`n`nCombine these folders into one, and do not name subfolders using the student ID because future searches should return only one folder.`n`nClick Go to open all matching folders, then fix this manually.`n`n$list"
    )
    if ($choice -eq 'Go') {
      $matches | ForEach-Object { Open-CtPath -PathValue $_.Path }
    }
    return
  }

  if ($matches.Count -eq 0) {
    $targetFolder = Join-Path $TeacherTemp $StudentFolderName
    $choice = Show-CtDialog -Title 'Create credit-transfer folder' -Buttons @('Create', 'Cancel') -Message (
      "No existing credit-transfer folder was found.`n`nA new student folder will be created in your temp folder, and a Credit (HE) form will be copied from the template.`n`nFolder:`n$targetFolder"
    )
    if ($choice -ne 'Create') { return }
    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
    $doc = Ensure-CtCreditDoc -FolderPath $targetFolder -StudentId $StudentId -CreditFileName $CreditFileName -TemplatePrimary $TemplatePrimary -TemplateFallback $TemplateFallback
    Copy-CtFolderClipboardDetails -FolderPath $targetFolder -FallbackStudentId $StudentId
    Write-CtStatusForStudent -StatusPath $StatusPath -StudentId $StudentId -CreditRoot $CreditRoot -TempRoot $TempRoot -TeacherTemp $TeacherTemp
    Open-CtPath -PathValue $targetFolder
    if ($doc) { Open-CtPath -PathValue $doc }
    return
  }

  $match = $matches[0]
  $folder = [string]$match.Path
  $creditDoc = Get-CtCreditDoc -FolderPath $folder -StudentId $StudentId
  $docStatus = if ($creditDoc) { "A matching Credit (HE) document was found." } else { "No matching Credit (HE) document was found; one will be created from the template if you proceed." }

  if ($match.Area -eq 'temp' -and $match.InCurrentTeacher) {
    $choice = Show-CtDialog -Title 'Credit-transfer folder in your temp' -Buttons @('Open', 'Cancel') -Message (
      "The student folder is already in your temp folder.`n`n$docStatus`n`nFolder:`n$folder"
    )
    if ($choice -ne 'Open') { return }
    $doc = Ensure-CtCreditDoc -FolderPath $folder -StudentId $StudentId -CreditFileName $CreditFileName -TemplatePrimary $TemplatePrimary -TemplateFallback $TemplateFallback
    Copy-CtFolderClipboardDetails -FolderPath $folder -FallbackStudentId $StudentId
    Write-CtStatusForStudent -StatusPath $StatusPath -StudentId $StudentId -CreditRoot $CreditRoot -TempRoot $TempRoot -TeacherTemp $TeacherTemp
    Open-CtPath -PathValue $folder
    if ($doc) { Open-CtPath -PathValue $doc }
    return
  }

  if ($match.Area -eq 'temp') {
    $owner = if ($match.Teacher) { $match.Teacher } else { 'another teacher' }
    $choice = Show-CtDialog -Title 'Credit-transfer folder in another temp' -Buttons @('Open', 'Take Control', 'Cancel') -Message (
      "The student folder is currently in $owner's temp folder.`n`n$docStatus`n`nIf you want to edit it, shift it to your own temp folder by clicking Take Control.`n`nFolder:`n$folder"
    )
    if ($choice -eq 'Cancel' -or -not $choice) { return }
    if ($choice -eq 'Take Control') {
      Show-CtInfo -Message 'Update Triage by putting your own name in the Handled by column.'
      $destination = Join-Path $TeacherTemp (Split-Path -Path $folder -Leaf)
      if (Test-Path -LiteralPath $destination) { $destination = Get-UniquePath -PathValue $destination }
      Move-Item -LiteralPath $folder -Destination $destination
      $folder = $destination
    }
    $doc = Ensure-CtCreditDoc -FolderPath $folder -StudentId $StudentId -CreditFileName $CreditFileName -TemplatePrimary $TemplatePrimary -TemplateFallback $TemplateFallback
    Copy-CtFolderClipboardDetails -FolderPath $folder -FallbackStudentId $StudentId
    Write-CtStatusForStudent -StatusPath $StatusPath -StudentId $StudentId -CreditRoot $CreditRoot -TempRoot $TempRoot -TeacherTemp $TeacherTemp
    Open-CtPath -PathValue $folder
    if ($doc) { Open-CtPath -PathValue $doc }
    return
  }

  $subFolderText = ''
  $creditRootClean = $CreditRoot.TrimEnd('\')
  $parent = [string]$match.Parent
  if ($parent -and -not (PathsEqual $parent $creditRootClean)) {
    $subFolderText = " It is inside sub-folder: $(Split-Path -Path $parent -Leaf)."
  }
  $choice = Show-CtDialog -Title 'Credit-transfer folder found' -Buttons @('Move', 'Just Open', 'Cancel') -Message (
    "The student's folder is in the credit transfers folder.$subFolderText`n`nIf you want to work on it, shift it into your own temp folder.`n`n$docStatus`n`nFolder:`n$folder"
  )
  if ($choice -eq 'Cancel' -or -not $choice) { return }
  if ($choice -eq 'Move') {
    $destination = Join-Path $TeacherTemp (Split-Path -Path $folder -Leaf)
    if (Test-Path -LiteralPath $destination) { $destination = Get-UniquePath -PathValue $destination }
    Move-Item -LiteralPath $folder -Destination $destination
    $folder = $destination
  }
  $doc = if ($choice -eq 'Just Open') { Get-CtCreditDoc -FolderPath $folder -StudentId $StudentId } else { Ensure-CtCreditDoc -FolderPath $folder -StudentId $StudentId -CreditFileName $CreditFileName -TemplatePrimary $TemplatePrimary -TemplateFallback $TemplateFallback }
  Copy-CtFolderClipboardDetails -FolderPath $folder -FallbackStudentId $StudentId
  Write-CtStatusForStudent -StatusPath $StatusPath -StudentId $StudentId -CreditRoot $CreditRoot -TempRoot $TempRoot -TeacherTemp $TeacherTemp
  Open-CtPath -PathValue $folder
  if ($doc) { Open-CtPath -PathValue $doc }
}

function Invoke-CtOpenWorkflow {
  param(
    [string]$StudentId,
    [string]$CreditRoot,
    [string]$TempRoot,
    [string]$TeacherTemp,
    [string]$StatusPath
  )
  if (-not $StudentId -or -not $CreditRoot -or -not $TempRoot -or -not $TeacherTemp) {
    Show-CtInfo -Message 'Cannot open credit-transfer folder because required folder paths were not supplied.'
    return
  }

  $matches = @(Get-CtAllMatches -StudentId $StudentId -CreditRoot $CreditRoot -TempRoot $TempRoot -TeacherTemp $TeacherTemp)
  Write-CtStatus -StatusPath $StatusPath -StudentId $StudentId -CreditRoot $CreditRoot -Matches $matches

  if ($matches.Count -eq 0) {
    Show-CtInfo -Message "No credit-transfer folder was found for $StudentId."
    return
  }

  if ($matches.Count -eq 1) {
    Copy-CtFolderClipboardDetails -FolderPath ([string]$matches[0].Path) -FallbackStudentId $StudentId
  }
  $matches | ForEach-Object { Open-CtPath -PathValue $_.Path }
}

function ConvertTo-HtmlText {
  param([string]$Value)
  $text = [string]$Value
  if ([string]::IsNullOrWhiteSpace($text)) { return '' }
  return [System.Net.WebUtility]::HtmlEncode($text) -replace "(\r\n|\r|\n)", '<br>'
}

function Get-ClipboardHtmlFragment {
  try {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
    if ([System.Windows.Forms.Clipboard]::ContainsData('HTML Format')) {
      $raw = [string][System.Windows.Forms.Clipboard]::GetData('HTML Format')
      if ($raw -match '(?s)<!--StartFragment-->(.*)<!--EndFragment-->') {
        return [string]$Matches[1]
      }
      if ($raw -match 'StartHTML:(\d+).*?EndHTML:(\d+)') {
        $start = [int]$Matches[1]
        $end = [int]$Matches[2]
        if ($start -ge 0 -and $end -gt $start -and $end -le $raw.Length) {
          return $raw.Substring($start, $end - $start)
        }
      }
      if ($raw) { return $raw }
    }
    if ([System.Windows.Forms.Clipboard]::ContainsText()) {
      return ConvertTo-HtmlText ([System.Windows.Forms.Clipboard]::GetText())
    }
  } catch {
    try {
      $plain = Get-Clipboard -Raw -ErrorAction Stop
      return ConvertTo-HtmlText $plain
    } catch {
      return ''
    }
  }
  return ''
}

function Invoke-OutlookEmailDraft {
  param(
    [string]$To,
    [string]$Subject,
    [string]$Salutation,
    [string]$Signoff
  )
  if ([string]::IsNullOrWhiteSpace($To)) {
    Show-CtInfo -Message 'Cannot create Outlook draft because no recipient was supplied.'
    return
  }
  $bodyHtml = Get-ClipboardHtmlFragment
  if ([string]::IsNullOrWhiteSpace($bodyHtml)) {
    Show-CtInfo -Message 'Cannot create Outlook draft because no HTML/text was found on the clipboard.'
    return
  }
  $salutationHtml = ConvertTo-HtmlText $Salutation
  $signoffHtml = ConvertTo-HtmlText $Signoff
  $html = @"
<html><body style="font-family:Calibri, Arial, sans-serif;font-size:11pt;line-height:1.15;">
<p style="margin:0 0 12pt 0;">$salutationHtml</p>
$bodyHtml
<p style="margin:12pt 0 0 0;">$signoffHtml</p>
</body></html>
"@
  try {
    $outlook = New-Object -ComObject Outlook.Application
    $mail = $outlook.CreateItem(0)
    $mail.To = $To
    $mail.Subject = $Subject
    $mail.HTMLBody = $html
    $mail.Display()
  } catch {
    Show-CtInfo -Message "Could not create Outlook draft.`n`n$($_.Exception.Message)"
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
$ctTempRaw = Get-QueryValue -Query $parsedUri.Query -Name 'ctTemp'
$ctTemp = [bool]($ctTempRaw -match '^(1|true|yes|y)$')
$ctOpenRaw = Get-QueryValue -Query $parsedUri.Query -Name 'ctOpen'
$ctOpen = [bool]($ctOpenRaw -match '^(1|true|yes|y)$')
$ctStatusRaw = Get-QueryValue -Query $parsedUri.Query -Name 'ctStatus'
$ctStatus = [bool]($ctStatusRaw -match '^(1|true|yes|y)$')
$emailDraftRaw = Get-QueryValue -Query $parsedUri.Query -Name 'emailDraft'
$emailDraft = [bool]($emailDraftRaw -match '^(1|true|yes|y)$')
$statusPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'statusPath'
$creditRootPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'creditRoot'
$tempRootPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'tempRoot'
$teacherTempPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'teacherTemp'
$templatePrimaryPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'template1'
$templateFallbackPath = Resolve-QueryPath -ParsedUri $parsedUri -Name 'template2'
$teacherNameText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'teacher')).Trim()
$studentFolderNameText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'folderName')).Trim()
$creditFileNameText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'creditFileName')).Trim()
$emailToText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'to')).Trim()
$emailSubjectText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'subject')).Trim()
$emailSalutationText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'salutation')).Trim()
$emailSignoffText = ([string](Get-QueryValue -Query $parsedUri.Query -Name 'signoff')).Trim()
$creditFormWordFields = @{
  StudentId = $studentIdText
  Dob = $dobText
  International = $internationalText
  FamilyName = $familyNameText
  GivenName = $givenNameText
  Email = $emailText
  Mobile = $mobileText
}

if ($emailDraft) {
  Invoke-OutlookEmailDraft -To $emailToText -Subject $emailSubjectText -Salutation $emailSalutationText -Signoff $emailSignoffText
  exit 0
}

if ($ctTemp) {
  Invoke-CtTempWorkflow `
    -StudentId $studentIdText `
    -CreditRoot $creditRootPath `
    -TempRoot $tempRootPath `
    -TeacherTemp $teacherTempPath `
    -TeacherName $teacherNameText `
    -StudentFolderName $studentFolderNameText `
    -CreditFileName $creditFileNameText `
    -TemplatePrimary $templatePrimaryPath `
    -TemplateFallback $templateFallbackPath `
    -StatusPath $statusPath
  exit 0
}

if ($ctOpen) {
  Invoke-CtOpenWorkflow `
    -StudentId $studentIdText `
    -CreditRoot $creditRootPath `
    -TempRoot $tempRootPath `
    -TeacherTemp $teacherTempPath `
    -StatusPath $statusPath
  exit 0
}

if ($ctStatus) {
  Write-CtStatusForStudent `
    -StatusPath $statusPath `
    -StudentId $studentIdText `
    -CreditRoot $creditRootPath `
    -TempRoot $tempRootPath `
    -TeacherTemp $teacherTempPath
  exit 0
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

Start-Process -FilePath 'explorer.exe' -ArgumentList "`"$launchPath`"" | Out-Null
exit 0
