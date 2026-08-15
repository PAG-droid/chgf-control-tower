# Convert every .pptx / .ppt in public\decks to PDF using the installed
# PowerPoint. Teams send whatever they have; the site only ever serves PDF,
# because browsers cannot render PowerPoint natively.
#
#   powershell -ExecutionPolicy Bypass -File scripts\convert-decks.ps1

$ErrorActionPreference = 'Stop'
$deckDir = Join-Path $PSScriptRoot '..\public\decks' | Resolve-Path

# Recurse: decks live in per-team folders (public\decks\q-kb-queens\...), not at
# the top level. -Include only filters when the path is a wildcard or -Recurse
# is on, so the two must stay together.
$decks = Get-ChildItem -Path $deckDir -Include *.pptx, *.ppt -File -Recurse -ErrorAction SilentlyContinue
if (-not $decks) {
    # ASCII only below this line. This file has no BOM, so PowerShell 5.1 reads
    # it as ANSI: a UTF-8 em-dash decodes to a smart quote and silently
    # terminates the string, breaking the parse of everything after it.
    Write-Host "No .pptx/.ppt files in $deckDir - nothing to convert."
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
# Recurse here too, or the summary silently omits every per-team folder.
Get-ChildItem -Path $deckDir -Filter *.pdf -Recurse | ForEach-Object {
    $rel = $_.FullName.Substring($deckDir.Path.Length + 1) -replace '\\', '/'
    "  {0}  ({1:N0} KB)" -f $rel, ($_.Length / 1KB)
}
