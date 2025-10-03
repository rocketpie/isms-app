# to help generate kb-5012-nextjs-app-isms-pages
[CmdletBinding()]
param(
  # leading . means relative to this script's location
  [string]$Path = ".\..\docker\web",  
  # make sure these are all lowercase!
  [string[]]$ExcludeDirs = @(".next", "node_modules")
)

$rootFolderPath = Resolve-Path ($Path -replace '^\.', $PSScriptRoot)

"searching '$($rootFolderPath)'..."
$allDirectories = Get-ChildItem -LiteralPath $rootFolderPath -Directory -Recurse -Force | Sort-Object -Property FullName

"found $($allDirectories.Count) directories..."
$excludeCount = 0
foreach ($directory in $allDirectories) {
  $relativeDirPath = [System.IO.Path]::GetRelativePath($rootFolderPath, $directory.FullName)
  $parts = $relativeDirPath.ToLower().Replace('\', '/').Trim('/').Split('/')
  if ((Compare-Object -ReferenceObject $parts -DifferenceObject $ExcludeDirs -IncludeEqual -ExcludeDifferent).Count -gt 0) {
    $excludeCount++
    continue
  }

  $anyFiles = Get-ChildItem -LiteralPath $directory.FullName -File -Recurse
  if ($anyFiles.Count -lt 1) { continue }
  
  # how deep this folder is relative to the root folder? 
  $relativeDirPath = [System.IO.Path]::GetRelativePath($rootFolderPath, $directory.FullName)
  $depth = ($relativeDirPath.Replace('\', '/').Trim('/').Split('/')).Count
  $indent = '  ' * $depth
  
  "$($indent)$($directory.Name)/"
  
  $files = Get-ChildItem -LiteralPath $directory.FullName -File
  foreach ($file in $files) {    
    $fileDescription = Get-Content -LiteralPath $file.FullName -TotalCount 2 | Select-Object -Skip 1
    if (($null -ne $fileDescription) -and $fileDescription.StartsWith('//Description:')) {
      "$($indent)  $($file.Name)  $($fileDescription.Replace('//Description: ', '# ').Trim())"
    }
    else {
      "$($indent)  $($file.Name)"
    }
  }
}

"(excluded $($excludeCount) directories)"


