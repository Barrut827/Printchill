param(
    [string]$InputFolder = (Join-Path $PSScriptRoot '..\POC material'),
    [string]$InteropPath = "$env:ProgramFiles\SOLIDWORKS Corp\SOLIDWORKS\SolidWorks.Interop.swdocumentmgr.dll"
)

$ErrorActionPreference = 'Stop'
$folder = (Resolve-Path -LiteralPath $InputFolder).Path
$files = @(Get-ChildItem -LiteralPath $folder -File | Where-Object Extension -in '.sldprt', '.sldasm', '.slddrw')
if ($files.Count -eq 0) { throw "Geen SolidWorks-bestanden in $folder" }
$report = [ordered]@{
    tested_at_utc = [DateTime]::UtcNow.ToString('o')
    process_bits = [IntPtr]::Size * 8
    license_key_supplied = $false
    status = 'not_tested'
    stage = 'precondition'
    error = $null
    files = @()
}
$factory = $null
$application = $null
$runningBefore = @(Get-Process -Name SLDWORKS -ErrorAction SilentlyContinue)
$report.solidworks_running_before = $runningBefore.Count -gt 0
try {
    if ($report.solidworks_running_before) {
        $report.status = 'blocked_solidworks_running'
        throw 'Sluit SolidWorks zelf en voer de proef opnieuw uit.'
    }
    # Inventory and baseline JSON are collected even when COM activation fails.
    foreach ($file in $files) {
        $baseline = $null
        $baselineError = $null
        $baselinePath = $file.FullName + '.printchill.json'
        if (Test-Path -LiteralPath $baselinePath) {
            try { $baseline = Get-Content -Raw -Encoding UTF8 -LiteralPath $baselinePath | ConvertFrom-Json }
            catch { $baselineError = $_.Exception.Message }
        }
        $report.files += [ordered]@{
            name = $file.Name
            path = $file.FullName
            sha256_before = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
            sha256_after = $null
            unchanged = $null
            baseline_schema = if ($baseline) { $baseline.schema_version } else { $null }
            baseline_properties = if ($baseline) { @($baseline.document_properties) } else { @() }
            baseline_error = $baselineError
            open_status = 'not_attempted'
            open_error_code = $null
            error = $null
        }
    }
    $report.stage = 'load_interop'
    if (-not (Test-Path -LiteralPath $InteropPath)) {
        throw 'Document Manager interop ontbreekt. Geef de locatie van SolidWorks.Interop.swdocumentmgr.dll op via -InteropPath.'
    }
    # Call the COM interfaces through their type library instead of IDispatch.
    Add-Type -Path $InteropPath
    Add-Type -ReferencedAssemblies $InteropPath -TypeDefinition @'
using SolidWorks.Interop.swdocumentmgr;
public static class PrintChillDocumentManagerProbe
{
    public static object Connect(object factory)
    {
        return ((ISwDMClassFactory)factory).GetApplication("");
    }
    public static object Open(object application, string path, int kind, out int error)
    {
        SwDmDocumentOpenError result;
        object document = ((ISwDMApplication)application).GetDocument(
            path, (SwDmDocumentType)kind, true, out result);
        error = (int)result;
        return document;
    }
    public static void Close(object document)
    {
        ((ISwDMDocument)document).CloseDoc();
    }
}
'@
    $report.stage = 'create_factory'
    $factory = New-Object -ComObject 'SwDocumentMgr.SwDMClassFactory'
    $report.stage = 'get_application_empty_key'
    $application = [PrintChillDocumentManagerProbe]::Connect($factory)
    if ($null -eq $application) {
        $report.status = 'empty_key_rejected'
    } else {
        $report.status = 'application_created'
        $report.stage = 'open_documents_read_only'
        foreach ($item in $report.files) {
            $document = $null
            try {
                $kind = switch ([IO.Path]::GetExtension($item.path).ToLowerInvariant()) {
                    '.sldprt' { 1 }; '.sldasm' { 2 }; '.slddrw' { 3 }
                }
                $openError = 0
                $document = [PrintChillDocumentManagerProbe]::Open($application, $item.path, $kind, [ref]$openError)
                $item.open_error_code = $openError
                $item.open_status = if ($null -ne $document -and $openError -eq 0) { 'opened_read_only' } else { 'failed' }
            } catch {
                $item.open_status = 'failed'
                $item.error = $_.Exception.Message
            } finally {
                if ($null -ne $document) {
                    try { [PrintChillDocumentManagerProbe]::Close($document) } finally { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($document) }
                }
            }
        }
        $failed = @($report.files | Where-Object { $_.open_status -ne 'opened_read_only' })
        $report.status = if ($failed.Count -eq 0) { 'opened_without_key' } else { 'document_open_failed' }
    }
} catch {
    if ($report.status -eq 'not_tested') { $report.status = 'failed' }
    $report.error = $_.Exception.Message
} finally {
    foreach ($item in $report.files) {
        try {
            $item.sha256_after = (Get-FileHash -LiteralPath $item.path -Algorithm SHA256).Hash
            $item.unchanged = $item.sha256_before -eq $item.sha256_after
        } catch { $item.error = $_.Exception.Message }
    }
    foreach ($comObject in @($application, $factory)) {
        if ($null -ne $comObject) { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($comObject) }
    }
}
$report.solidworks_running_after = @(Get-Process -Name SLDWORKS -ErrorAction SilentlyContinue).Count -gt 0
if ($report.solidworks_running_after -and -not $report.solidworks_running_before) {
    $report.status = 'inconclusive_solidworks_started'
}
if (@($report.files | Where-Object { $_.unchanged -ne $true }).Count -gt 0) {
    $report.status = 'source_integrity_check_failed'
}
$output = Join-Path $folder ('document-manager-probe-' + [guid]::NewGuid().ToString('N') + '.json')
$report | ConvertTo-Json -Depth 12 | Out-File -LiteralPath $output -Encoding utf8 -NoClobber
Write-Host "Resultaat: $($report.status); stap: $($report.stage)"
Write-Host "Rapport: $output"
if ($report.error) { Write-Host $report.error }
if ($report.status -ne 'opened_without_key') { exit 1 }
