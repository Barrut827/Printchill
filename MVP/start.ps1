$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot 'node.exe'
if (!(Test-Path -LiteralPath $runtime)) { $runtime = (Get-Command node.exe).Source }
$serviceUrl = 'http://127.0.0.1:47831'
function Test-PrintChill {
  try { return (Invoke-WebRequest "$serviceUrl/" -UseBasicParsing -TimeoutSec 2).Content.Contains('name="prc-token"') } catch { return $false }
}
if (!(Test-PrintChill)) {
  $process = Start-Process -FilePath $runtime -ArgumentList 'server.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
  for ($i=0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 200
    if (Test-PrintChill) { break }
    if ($process.HasExited) { throw 'PrintChill could not start. Check port 47831 and workspace settings.' }
  }
}
if (!(Test-PrintChill)) { throw 'Local backend unavailable.' }
Start-Process $serviceUrl
