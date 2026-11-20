[CmdletBinding(SupportsShouldProcess)]
param()
$ErrorActionPreference = 'Stop'
$listeners = @(Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -eq 47831 })
if (!$listeners.Count) { Write-Host 'PRC is al gestopt.'; return }
if ($listeners.Count -ne 1 -or $listeners[0].LocalAddress -ne '127.0.0.1') {
  throw 'Poort 47831 heeft een onverwachte listener. Controleer deze handmatig.'
}
$process = Get-Process -Id $listeners[0].OwningProcess
$response = Invoke-WebRequest 'http://127.0.0.1:47831/' -UseBasicParsing -TimeoutSec 3
if ($process.ProcessName -ne 'node' -or !$response.Content.Contains('name="prc-token"') -or !$response.Content.Contains('<title>PrintChill')) {
  throw 'De listener op poort 47831 is niet herkend als PrintChill.'
}
if ($PSCmdlet.ShouldProcess("PrintChill backend (PID $($process.Id))", 'Stoppen')) {
  $process.Kill()
  if (!$process.WaitForExit(5000)) { throw 'De backend reageert niet op stoppen.' }
  Write-Host 'PRC-backend gestopt.'
}
