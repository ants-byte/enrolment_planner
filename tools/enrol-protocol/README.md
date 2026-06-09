# Enrol Protocol Handler (`enrol://`)

This registers a per-user Windows protocol handler so the web app can open local folders directly via:

`enrol://open?path=C%3A%5C...`

It also supports one-click file workflows by query params:

- `mkdir=<abs path>` create folder (and parents)
- `mkdirFallback=<abs path>` fallback folder path if primary parent is unavailable
- `copyFrom=<abs file path>` + `copyTo=<abs file path>` copy template/file
- `copyFromFallback=<abs file path>` fallback source file if primary source is missing
- `copyToFallback=<abs file path>` fallback copy destination
- `renameFrom=<abs path>` + `renameTo=<abs path>` rename/move
- `select=<abs path>` open Explorer with file/folder selected
- `selectFallback=<abs path>` fallback selection target
- `openFile=1` open selected file with default app (for example Word for `.docx`)
- `sid=<text>&dob=<text>&intl=<text>&family=<text>&given=<text>&email=<text>&mobile=<text>` optional text fields used to autofill top table cells in Credit Form `.docx` files before opening
- `overwrite=1` allow replacement; otherwise existing copy targets are reused and rename conflicts get ` (2)`, ` (3)`, etc.

## Install

Run PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\enrol-protocol\install-enrol-protocol.ps1
```

Then restart your browser.

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\enrol-protocol\uninstall-enrol-protocol.ps1
```

## Launcher

`enrol-protocol-launcher.ps1` receives the protocol URL, applies requested file actions (if present), then launches:

`explorer.exe <resolved-folder-path>`
