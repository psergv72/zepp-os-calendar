$buildFile = Join-Path $PSScriptRoot "build.json"
$appJsonPath = Join-Path $PSScriptRoot "app.json"
$packageJsonPath = Join-Path $PSScriptRoot "package.json"

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$buildData = Get-Content $buildFile -Raw | ConvertFrom-Json
$buildNum = $buildData.build

$versionName = "0.2.$buildNum"

$appContent = Get-Content $appJsonPath -Raw -Encoding UTF8
$appContent = $appContent -replace '"name": "\d+\.\d+\.\d+"', "`"name`": `"$versionName`""
$appContent = $appContent -replace '"code": \d+', "`"code`": $buildNum"
[System.IO.File]::WriteAllText($appJsonPath, $appContent, $utf8NoBom)

$pkgContent = Get-Content $packageJsonPath -Raw -Encoding UTF8
$pkgContent = $pkgContent -replace '"version": "\d+\.\d+\.\d+"', "`"version`": `"$versionName`""
[System.IO.File]::WriteAllText($packageJsonPath, $pkgContent, $utf8NoBom)

$buildData.build = $buildNum + 1
$buildJson = $buildData | ConvertTo-Json
[System.IO.File]::WriteAllText($buildFile, $buildJson, $utf8NoBom)

Write-Host "Version updated to $versionName (next build: $($buildData.build))"
