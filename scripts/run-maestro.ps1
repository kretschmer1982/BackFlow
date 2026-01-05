# Maestro E2E Test Runner
# Setzt PATH/Android-SDK, startet Emulator bei Bedarf und schreibt Ergebnisse mit Timestamp
param(
    [string]$FlowPath = ".maestro/",
    [string]$ResultsRoot = "test-results/maestro",
    [string]$AvdName = "Pixel_7_API_36",
    [switch]$SkipReleaseInstall
)

$env:PATH = "$env:USERPROFILE\.maestro\maestro\bin;$env:PATH"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"

if (-not (Test-Path $FlowPath)) {
    Write-Error "Flow-Pfad '$FlowPath' existiert nicht."
    exit 1
}

$adbPath = Join-Path $env:ANDROID_SDK_ROOT "platform-tools\adb.exe"
$emulatorExe = Join-Path $env:ANDROID_SDK_ROOT "emulator\emulator.exe"

function Get-RunningEmulatorId {
    $devices = & $adbPath devices
    foreach ($line in $devices) {
        if ($line -match "^emulator-\d+" -and $line -notmatch "offline") {
            return ($line -split "\s+")[0]
        }
    }
    return $null
}

function Ensure-Emulator {
    $emulatorId = Get-RunningEmulatorId
    if ($emulatorId) {
        Write-Host "Verwendeter Emulator: $emulatorId" -ForegroundColor Yellow
        return $emulatorId
    }

    if (-not (Test-Path $emulatorExe)) {
        Write-Error "Emulator-Binary nicht gefunden: $emulatorExe"
        exit 1
    }

    Write-Host "Starte AVD $AvdName..." -ForegroundColor Cyan
    Start-Process $emulatorExe -ArgumentList "-avd", $AvdName, "-no-snapshot-load", "-gpu", "swiftshader_indirect" -WindowStyle Hidden | Out-Null

    $timeout = (Get-Date).AddMinutes(3)
    do {
        Start-Sleep -Seconds 3
        $emulatorId = Get-RunningEmulatorId
    } while (-not $emulatorId -and (Get-Date) -lt $timeout)

    if (-not $emulatorId) {
        Write-Error "Emulator konnte nicht gestartet werden."
        exit 1
    }

    Write-Host "Emulator $emulatorId läuft, warte auf Boot..." -ForegroundColor Cyan
    while ($true) {
        $boot = ""
        try {
            $boot = (& $adbPath -s $emulatorId shell getprop sys.boot_completed).Trim()
        } catch {
            Start-Sleep -Seconds 2
            continue
        }
        if ($boot -eq "1") { break }
        Start-Sleep -Seconds 2
    }

    Write-Host "Emulator $emulatorId ist bereit." -ForegroundColor Cyan
    return $emulatorId
}

function Get-DesiredVersionCode {
    $buildFile = Join-Path (Resolve-Path .).Path "android\app\build.gradle"
    foreach ($line in Get-Content $buildFile) {
        if ($line -match 'versionCode\s+(\d+)') {
            return [int]$Matches[1]
        }
    }
    return $null
}

function Get-InstalledVersionCode {
    $dumpsys = & $adbPath -s $emulatorId shell dumpsys package com.kretschmer1982.BackFlow 2>$null
    if (-not $dumpsys) {
        return $null
    }

    $match = [regex]::Match($dumpsys, 'versionCode=(\d+)')
    if ($match.Success) {
        return [int]$match.Groups[1].Value
    }

    return $null
}

function Install-ReleaseIfNeeded {
    $desiredVersion = Get-DesiredVersionCode
    if (-not $desiredVersion) {
        Write-Host "versionCode konnte nicht ermittelt werden - Release-Install wird übersprungen." -ForegroundColor Yellow
        return
    }

    $installedVersion = Get-InstalledVersionCode
    if ($installedVersion -and $installedVersion -eq $desiredVersion) {
        Write-Host "Release in Version $desiredVersion bereits installiert." -ForegroundColor Yellow
        return
    }

    $gradlew = Join-Path (Resolve-Path .).Path "android\gradlew.bat"
    if (-not (Test-Path $gradlew)) {
        Write-Error "gradlew nicht gefunden: $gradlew"
        exit 1
    }

    Write-Host "Baue und installiere Release $desiredVersion..." -ForegroundColor Cyan
    Push-Location "android"
    & $gradlew installRelease | Out-Null
    Pop-Location
}

function Ensure-AppStateAtHome {
    & $adbPath -s $emulatorId shell input keyevent 4 | Out-Null
    Start-Sleep -Milliseconds 200
    & $adbPath -s $emulatorId shell input keyevent 4 | Out-Null
    Start-Sleep -Milliseconds 200
    & $adbPath -s $emulatorId shell input keyevent 3 | Out-Null
    Write-Host "App wurde in Initialzustand gebracht." -ForegroundColor Cyan
}

$emulatorId = Ensure-Emulator
$skipReleaseInstall = $SkipReleaseInstall.IsPresent -or ($env:BACKFLOW_SKIP_RELEASE_INSTALL -eq "1")
if ($skipReleaseInstall) {
    Write-Host "Release-Install wird übersprungen (installed already/invoked with skip flag)." -ForegroundColor Yellow
} else {
    Install-ReleaseIfNeeded
}

New-Item -ItemType Directory -Force -Path $ResultsRoot | Out-Null
$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$resultsDir = Join-Path $ResultsRoot $timestamp
$artifactsDir = Join-Path $resultsDir "artifacts"
New-Item -ItemType Directory -Force -Path $artifactsDir | Out-Null

$meta = @{
    timestamp   = (Get-Date).ToString("o")
    flow        = $FlowPath
    resultsPath = (Resolve-Path $resultsDir).Path
}

Write-Host "Running Maestro tests from: $FlowPath" -ForegroundColor Cyan
Write-Host "Results are written to: $resultsDir" -ForegroundColor Cyan

maestro test $FlowPath `
    --format junit `
    --output "$resultsDir\maestro-results.xml" `
    --test-output-dir $artifactsDir

$exitCode = $LASTEXITCODE
$meta.status = if ($exitCode -eq 0) { "passed" } else { "failed" }

$meta | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 "$resultsDir\meta.json"
$meta | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 test-results/.last-run.json

if ($emulatorId) {
    Ensure-AppStateAtHome
    & $adbPath -s $emulatorId shell am force-stop com.kretschmer1982.BackFlow | Out-Null
    Write-Host "App auf Emulator $emulatorId beendet." -ForegroundColor Cyan
}

exit $exitCode

