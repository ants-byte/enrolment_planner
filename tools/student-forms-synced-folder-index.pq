let
    Folders = Table.Buffer(#"Student Forms - Folder Paths"),
    WithIds = Table.AddColumn(Folders, "StudentNum Extracted as String", each let
        Name = Text.Trim([Name]),
        WithoutPrefix = if Text.StartsWith(Name, "S", Comparer.OrdinalIgnoreCase) then Text.Range(Name, 1) else Name,
        Digits = Text.Combine(List.FirstN(Text.ToList(WithoutPrefix), each List.Contains({"0".."9"}, _)))
    in if List.Contains({6, 7}, Text.Length(Digits)) then Text.PadStart(Digits, 7, "0") else "", type text),
    WithLinks = Table.AddColumn(WithIds, "PathToFolder", each [FullPath], type text),
    WithLabels = Table.AddColumn(WithLinks, "Folder within student forms", each
        Text.TrimEnd(Text.AfterDelimiter([FullPath], "Student Forms\"), "\"), type text),
    StudentFolders = Table.SelectRows(WithIds, each [StudentNum Extracted as String] <> ""),
    Counts = Table.Group(StudentFolders, {"StudentNum Extracted as String"}, {{"FolderCount", each Table.RowCount(_), Int64.Type}}),
    Joined = Table.NestedJoin(WithLabels, {"StudentNum Extracted as String"}, Counts, {"StudentNum Extracted as String"}, "Counts", JoinKind.LeftOuter),
    Expanded = Table.ExpandTableColumn(Joined, "Counts", {"FolderCount"}),
    WithDuplicates = Table.AddColumn(Expanded, "duplicates", each
        if [FolderCount] = null then 0 else if [FolderCount] > 1 then 1 else 0, Int64.Type),
    WithDuplicateIds = Table.AddColumn(WithDuplicates, "Duplicate Student IDs", each
        if [duplicates] = 1 then [StudentNum Extracted as String] else "", type text),
    WithPathCheck = Table.AddColumn(WithDuplicateIds, "Path too long", each
        if Text.Length([PathToFolder]) > 255 then "Path too long" else "", type text),
    Result = Table.SelectColumns(WithPathCheck, {
        "Name", "FullPath", "StudentNum Extracted as String", "PathToFolder",
        "Folder within student forms", "duplicates", "Duplicate Student IDs", "Path too long"
    })
in
    Result
