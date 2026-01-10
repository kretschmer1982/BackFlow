# Maestro E2E Test Runner
# Setzt PATH/Android-SDK, startet Emulator bei Bedarf und schreibt Ergebnisse mit Timestamp
param(
    [string]$FlowPath = ".maestro/",
    [string]$ResultsRoot = "test-results/maestro",
    [string]$AvdName = "Pixel_7_API_36",
    [switch]$SkipInstall
)

$env:PATH = "$env:USERPROFILE\.maestro\maestro\bin;$env:PATH"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$workspaceRoot = (Resolve-Path ".").Path
$buildsRoot = Join-Path $workspaceRoot "builds\android"

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

function Ensure-AppStateAtHome {
    & $adbPath -s $emulatorId shell input keyevent 4 | Out-Null
    Start-Sleep -Milliseconds 200
    & $adbPath -s $emulatorId shell input keyevent 4 | Out-Null
    Start-Sleep -Milliseconds 200
    & $adbPath -s $emulatorId shell input keyevent 3 | Out-Null
    Write-Host "App wurde in Initialzustand gebracht." -ForegroundColor Cyan
}

function Parse-Version {
    param([string]$Version)
    $parts = $Version.Split('.') | ForEach-Object { [int]$_ }
    while ($parts.Count -lt 3) { $parts += 0 }
    return $parts
}

function Compare-Version {
    param($a, $b)
    for ($i = 0; $i -lt 3; $i++) {
        if ($a[$i] -gt $b[$i]) { return 1 }
        if ($a[$i] -lt $b[$i]) { return -1 }
    }
    return 0
}

function Get-HighestApk {
    $files = Get-ChildItem -Path $buildsRoot -Filter "app-*-*.apk" -ErrorAction SilentlyContinue
    $best = $null
    foreach ($file in $files) {
        if ($file.Name -match '^app-(release|prebuild)-(\d+\.\d+\.\d+)\.apk$') {
            $entry = [pscustomobject]@{
                Path = $file.FullName
                Type = $Matches[1]
                Version = $Matches[2]
                VersionParts = Parse-Version $Matches[2]
            }
            if (-not $best) {
                $best = $entry
                continue
            }
            $cmp = Compare-Version $entry.VersionParts $best.VersionParts
            if ($cmp -gt 0) {
                $best = $entry
            } elseif ($cmp -eq 0 -and $entry.Type -eq "release" -and $best.Type -eq "prebuild") {
                $best = $entry
            }
        }
    }
    return $best
}

function Install-Apk {
    param(
        [string]$Path,
        [string]$Description
    )
    Write-Host ("Installiere {0}: {1}" -f $Description, $Path) -ForegroundColor Cyan
    & $adbPath -s $emulatorId install -r $Path | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Installation erfolgreich." -ForegroundColor Green
        return $true
    }
    Write-Warning "Installation von $Description fehlgeschlagen."
    return $false
}

$emulatorId = Ensure-Emulator
if ($emulatorId) {
    & $adbPath -s $emulatorId wait-for-device | Out-Null
    $bootProp = (& $adbPath -s $emulatorId shell getprop sys.boot_completed 2>$null).Trim()
    if ($bootProp -ne "1") {
        $maxRetries = 40
        $retry = 0
        while ($retry -lt $maxRetries) {
            $focusOutput = & $adbPath -s $emulatorId shell dumpsys window windows 2>$null
            $focusLine = $focusOutput | Select-String -Pattern 'mCurrentFocus='
            if ($focusLine -and $focusLine -notmatch 'mCurrentFocus\s*=\s*null') {
                break
            }
            Start-Sleep -Seconds 2
            $retry++
        }
    }
}

if (-not $SkipInstall) {
    $apk = Get-HighestApk
    if (-not $apk) {
        Write-Error "Keine vorbereitete Release- oder Prebuild-APK gefunden."
        exit 1
    }
    Install-Apk -Path $apk.Path -Description "$($apk.Type) $($apk.Version)"
} else {
    Write-Host "APK-Installation übersprungen (SkipInstall gesetzt)." -ForegroundColor Yellow
}

New-Item -ItemType Directory -Force -Path $ResultsRoot | Out-Null
$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$resultsDir = Join-Path $ResultsRoot $timestamp
$artifactsDir = Join-Path $resultsDir "artifacts"
New-Item -ItemType Directory -Force -Path $artifactsDir | Out-Null

Write-Host "Running Maestro tests from: $FlowPath" -ForegroundColor Cyan
Write-Host "Results are written to: $resultsDir" -ForegroundColor Cyan

maestro test $FlowPath `
    --format junit `
    --output "$resultsDir\maestro-results.xml" `
    --test-output-dir $artifactsDir

$exitCode = $LASTEXITCODE
$meta = @{
    timestamp   = (Get-Date).ToString("o")
    flow        = $FlowPath
    resultsPath = (Resolve-Path $resultsDir).Path
    appVersion  = @{
        apk = if ($apk) { [string]$apk.Name } else { $null }
    }
    status = if ($exitCode -eq 0) { "passed" } else { "failed" }
}

$meta | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 "$resultsDir\meta.json"
$meta | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 test-results/.last-run.json

if ($emulatorId) {
    Ensure-AppStateAtHome
    & $adbPath -s $emulatorId shell am force-stop com.kretschmer1982.BackFlow | Out-Null
    Write-Host "App auf Emulator $emulatorId beendet." -ForegroundColor Cyan
}

exit $exitCode

