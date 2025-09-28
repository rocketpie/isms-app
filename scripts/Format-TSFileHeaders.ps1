$webFolderPath = Resolve-Path (Join-Path $PSScriptRoot '..\docker\web')
$tsFiles = @('app', 'lib') | ForEach-Object { Get-ChildItem -Path (Join-Path $webFolderPath $_) -Recurse -File } | Where-Object { [System.IO.Path]::GetExtension($_.Name) -in @('.ts', '.tsx') }

"found $($tsFiles.Count) ts(x) files..."
foreach ($file in $tsFiles) {
    $relativePath = [System.IO.Path]::GetRelativePath($webFolderPath, $file.FullName)
    $fileHeader = "//$($relativePath)".Replace('\', '/')

    $content = [System.IO.File]::ReadAllLines($file.FullName)
    "content? $($content.GetType().FullName)"
    $firstLine = $content | Select-Object -First 1 

    $firstLineMatch = $firstLine.StartsWith($fileHeader)
    "testing '$($firstLine)' to start with '$($fileHeader)' ($($firstLineMatch))..."
    if (-not $firstLineMatch) {
        [System.IO.File]::WriteAllLines($file.FullName, @($fileHeader, " "))
        [System.IO.File]::AppendAllLines($file.FullName, $content)
    }
}