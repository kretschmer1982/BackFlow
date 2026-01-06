param(
    [ValidateSet("main", "major", "minor")]
    [string]$ChangeLevel = "minor"
)

Set-StrictMode -Version Latest

$buildGradle = Resolve-Path "android/app/build.gradle"
$content = Get-Content $buildGradle -Raw -Encoding UTF8

$versionNameMatch = [regex]::Match($content, 'versionName\s+"([^"]+)"')
if (-not $versionNameMatch.Success) {
    Write-Error "versionName konnte in $buildGradle nicht gefunden werden."
    exit 1
}

$versionCodeMatch = [regex]::Match($content, 'versionCode\s+(\d+)')
if (-not $versionCodeMatch.Success) {
    Write-Error "versionCode konnte in $buildGradle nicht gefunden werden."
    exit 1
}

$parts = $versionNameMatch.Groups[1].Value.Split(".") | ForEach-Object { [int]$_ }
while ($parts.Count -lt 3) { $parts += 0 }

switch ($ChangeLevel.ToLower()) {
    "main" {
        $parts[0]++
        $parts[1] = 0
        $parts[2] = 0
    }
    "major" {
        $parts[1]++
        $parts[2] = 0
    }
    "minor" {
        $parts[2]++
    }
}

$newVersionName = "$($parts[0]).$($parts[1]).$($parts[2])"
$newVersionCode = ($parts[0] * 10000) + ($parts[1] * 100) + $parts[2]

$updated = $content -replace 'versionCode\s+\d+', "versionCode $newVersionCode"
$updated = $updated -replace 'versionName\s+"[^"]+"', "versionName `"$newVersionName`""

# UTF-8 ohne BOM schreiben (PowerShell 5.1 kompatibel)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($buildGradle, $updated, $utf8NoBom)

Write-Host "Neue Version: $newVersionName (code $newVersionCode)" -ForegroundColor Cyan

Push-Location "android"
try {
    & .\gradlew.bat assembleRelease
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Error $_
    exit 1
} finally {
    Pop-Location
}

$apkDir = "android/app/build/outputs/apk/release"
$targetDir = "builds/android"

# Sicherstellen, dass Zielordner existiert
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
}

$sourceApk = Join-Path $apkDir "app-release.apk"
$destApk = Join-Path $targetDir "app-release-$newVersionName.apk"

if (Test-Path $sourceApk) {
    Copy-Item -Path $sourceApk -Destination $destApk -Force
    Write-Host "APK archiviert nach: $destApk" -ForegroundColor Green

    # Alte Versionen im Zielordner aufräumen (behalte die neuesten 3)
    # @(...) erzwingt ein Array, damit .Count auch bei 0 oder 1 Element funktioniert
    $apks = @(Get-ChildItem -Path $targetDir -Filter "app-release-*.apk") | Sort-Object LastWriteTime -Descending
    
    if ($apks.Count -gt 3) {
        $apks | Select-Object -Skip 3 | ForEach-Object {
            Remove-Item $_.FullName
            Write-Host "Altes Release gelöscht: $($_.Name)" -ForegroundColor Gray
        }
    }
} else {
    Write-Warning "Build war erfolgreich, aber $sourceApk wurde nicht gefunden."
}

