# Convert every .pptx / .ppt in public\decks to PDF using the installed
# PowerPoint. Teams send whatever they have; the site only ever serves PDF,
# because browsers cannot render PowerPoint natively.
#
#   powershell -ExecutionPolicy Bypass -File scripts\convert-decks.ps1

$ErrorActionPreference = 'Stop'
$deckDir = Join-Path $PSScriptRoot '..\public\decks' | Resolve-Path

$decks = Get-ChildItem -Path $deckDir -Include *.pptx, *.ppt -File -Recurse:$false -ErrorAction SilentlyContinue
if (-not $decks) {
    Write-Host "No .pptx/.ppt files in $deckDir — nothing to convert."
    exit 0
}

Write-Host "Converting $($decks.Count) deck(s)..."
$ppt = New-Object -ComObject PowerPoint.Application

try {
    foreach ($deck in $decks) {
        $pdf = [IO.Path]::ChangeExtension($deck.FullName, '.pdf')
        if (Test-Path $pdf) {
            Write-Host "  skip (PDF exists): $($deck.Name)"
            continue
        }
        Write-Host "  $($deck.Name) -> $([IO.Path]::GetFileName($pdf))"
        # WithWindow:$false keeps PowerPoint off-screen; 32 = ppSaveAsPDF
        $pres = $ppt.Presentations.Open($deck.FullName, $true, $false, $false)
        try   { $pres.SaveAs($pdf, 32) }
        finally { $pres.Close() }
    }
}
finally {
    $ppt.Quit()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($ppt)
}

Write-Host "Done. PDFs are in $deckDir"
Get-ChildItem -Path $deckDir -Filter *.pdf | ForEach-Object {
    "  {0}  ({1:N0} KB)" -f $_.Name, ($_.Length / 1KB)
}
