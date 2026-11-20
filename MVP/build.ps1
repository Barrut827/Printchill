$ErrorActionPreference = 'Stop'
$runtime = (Get-Command node.exe).Source
if ((& $runtime -p "process.arch") -ne 'x64') { throw 'Use the x64 Node runtime.' }
$package = Join-Path $PSScriptRoot 'dist\PrintChill-0.1.1-win-x64'
New-Item -ItemType Directory -Force -Path $package | Out-Null
foreach ($file in 'install.cmd','install.ps1','start.cmd','launch.mjs','start.ps1','server.mjs','store.mjs','app.js','index.html','style.css','README.md') {
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $package -Force
}
Copy-Item -LiteralPath $runtime -Destination $package -Force
$nodeVersion = & $runtime -v
$licensePath = Join-Path $package 'NODE-LICENSE.txt'
$localLicense = Join-Path (Split-Path $runtime) 'LICENSE'
if (Test-Path $localLicense) { Copy-Item $localLicense $licensePath -Force }
else { Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/nodejs/node/$nodeVersion/LICENSE" -OutFile $licensePath }
Compress-Archive -Path $package -DestinationPath "$package.zip" -Force -CompressionLevel Fastest
Write-Host "$package.zip"
