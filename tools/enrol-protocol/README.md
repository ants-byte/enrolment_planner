# Enrol Protocol Handler (`enrol://`)

This registers a per-user Windows protocol handler so the web app can open local folders directly via:

`enrol://open?path=C%3A%5C...`

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

`enrol-protocol-launcher.ps1` receives the protocol URL and launches:

`explorer.exe <resolved-folder-path>`
