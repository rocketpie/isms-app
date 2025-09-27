$appFolderPath = Join-Path $PSScriptRoot "..\docker\web\app"
$tsFiles = Get-ChildItem -Path $appFolderPath -Recurse -File | ? { [System.IO.Path]::GetExtension($_.Name) -in @('.ts', '.tsx') }
$webFolderPath = Resolve-Path (Join-Path $appFolderPath '..')

"found $($tsFiles.Count) ts(x) files..."
foreach ($file in $tsFiles) {
    $relativePath = [System.IO.Path]::GetRelativePath($webFolderPath, $file.FullName)
    $fileHeader = "//$($relativePath)"

    $firstLine = Get-Content -LiteralPath $file.FullName -ReadCount 1 

    "testing '$($firstLine)' to start with '$($fileHeader)'..."
    if (-not $firstLine.StartsWith($fileHeader)) {
        $content = Get-Content -LiteralPath $file.FullName
        $content = @($fileHeader) + $content
        Set-Content -LiteralPath $file.FullName -Value $content
    }
}