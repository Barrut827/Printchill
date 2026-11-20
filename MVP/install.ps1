$ErrorActionPreference = 'Stop'
$installDir = Join-Path $env:LOCALAPPDATA 'Programs\PrintChill'
New-Item -Path $installDir -ItemType Directory -Force | Out-Null
if (Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.ExecutablePath -eq (Join-Path $installDir 'node.exe') }) {
  throw 'Exit the installed PrintChill backend before upgrading (or sign out and sign in).'
}
foreach ($file in 'node.exe','server.mjs','store.mjs','merge.mjs','library.js','reports.js','viewer.bundle.js','metadata.bundle.mjs','THIRD-PARTY.txt','launch.mjs','start.cmd','app.js','style.css','index.html','start.ps1','README.md','NODE-LICENSE.txt') {
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $installDir -Force
}
$menu = [Environment]::GetFolderPath('Programs')
$shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $menu 'PrintChill.lnk'))
$shortcut.TargetPath = (Get-Command powershell.exe).Source
$shortcut.Arguments = '-NoProfile -ExecutionPolicy RemoteSigned -WindowStyle Hidden -File "' + (Join-Path $installDir 'start.ps1') + '"'
$shortcut.WorkingDirectory = $installDir
$shortcut.Save()
Write-Host 'Installed. Open PrintChill from the Start menu.'
