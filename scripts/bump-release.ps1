param(
    [ValidateSet("main", "major", "minor")]
    [string]$ChangeLevel = "minor",
    [switch]$Debug,
    [switch]$Prebuild
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

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($buildGradle, $updated, $utf8NoBom)

function Write-LastBuildType {
    param([string]$Type)
    $lastBuildFile = Join-Path (Resolve-Path .).Path "builds\android\last-build-type.txt"
    $dir = Split-Path $lastBuildFile
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
    Set-Content -Encoding utf8 $lastBuildFile $Type
}

function Cleanup-OldApks {
    param([string]$TargetDir)
    $files = Get-ChildItem -Path $TargetDir -Filter "app-*-*.apk"
    $entries = foreach ($file in $files) {
        if ($file.Name -match '^app-(release|prebuild)-(\d+\.\d+\.\d+)\.apk$') {
            [pscustomobject]@{
                Path = $file.FullName
                Name = $file.Name
                Version = $Matches[2]
                VersionParts = $Matches[2].Split('.') | ForEach-Object { [int]$_ }
            }
        }
    }
    $ordered = $entries | Sort-Object @{Expression={$_.VersionParts[0]};Descending=$true}, @{Expression={$_.VersionParts[1]};Descending=$true}, @{Expression={$_.VersionParts[2]};Descending=$true}
    $toRemove = $ordered | Select-Object -Skip 3
    foreach ($entry in $toRemove) {
        Remove-Item $entry.Path -Force
        Write-Host "Alte APK entfernt: $($entry.Name)" -ForegroundColor Gray
    }
}

if ($Prebuild) {
    Write-Host "Prebuilt Dev-Build erzeugt (Version bleibt $newVersionName)." -ForegroundColor Cyan
} elseif (-not $Debug) {
    Write-Host "Neue Version: $newVersionName (code $newVersionCode)" -ForegroundColor Cyan
} else {
    Write-Host "Debug-Build: Versionserhöhung übersprungen" -ForegroundColor Yellow
}

Push-Location "android"
try {
    $task = if ($Prebuild -or $Debug) { "assembleDebug" } else { "assembleRelease" }
    & .\gradlew.bat $task
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Error $_
    exit 1
} finally {
    Pop-Location
}

$apkDir = "android/app/build/outputs/apk"
$targetDir = "builds/android"

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
}

$buildType = if ($Prebuild) { "prebuild" } elseif ($Debug) { "debug" } else { "release" }
$sourceRelative = if ($buildType -eq "release") { "release/app-release.apk" } else { "debug/app-debug.apk" }
$sourceApk = Join-Path $apkDir $sourceRelative
$destApk = Join-Path $targetDir "app-$buildType-$newVersionName.apk"

if (Test-Path $sourceApk) {
    Copy-Item -Path $sourceApk -Destination $destApk -Force
    Write-Host "APK archiviert nach: $destApk" -ForegroundColor Green
    Write-LastBuildType $buildType
    Cleanup-OldApks -TargetDir $targetDir
} else {
    Write-Warning "Build war erfolgreich, aber $sourceApk wurde nicht gefunden."
}
