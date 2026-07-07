# TexasSolver Console Build Script (VS 2022)
# Run this from: PoNotes/texasSolver/
# Prerequisites: Visual Studio 2022 with C++ workload, CMake >= 3.15

param(
    [string]$RepoDir = "..\TexasSolver",
    [string]$VsVersion = "2022"
)

$ErrorActionPreference = "Stop"

# --- 1. Checkout console branch ---
Write-Host "`n=== Step 1: Checkout console branch ===" -ForegroundColor Cyan
Push-Location $RepoDir
git checkout console
if ($LASTEXITCODE -ne 0) { throw "Failed to checkout console branch" }
Pop-Location

# --- 2. Find vcvars64.bat ---
Write-Host "`n=== Step 2: Finding VS $VsVersion ===" -ForegroundColor Cyan

$vsEditions = @("Community", "Professional", "Enterprise", "BuildTools")
$vcvarsPath = $null

foreach ($edition in $vsEditions) {
    $candidate = "C:\Program Files\Microsoft Visual Studio\$VsVersion\$edition\VC\Auxiliary\Build\vcvars64.bat"
    if (Test-Path $candidate) {
        $vcvarsPath = $candidate
        Write-Host "  Found: $candidate" -ForegroundColor Green
        break
    }
}

# Also check for VS in Program Files (x86)
if (-not $vcvarsPath) {
    foreach ($edition in $vsEditions) {
        $candidate = "C:\Program Files (x86)\Microsoft Visual Studio\$VsVersion\$edition\VC\Auxiliary\Build\vcvars64.bat"
        if (Test-Path $candidate) {
            $vcvarsPath = $candidate
            Write-Host "  Found: $candidate" -ForegroundColor Green
            break
        }
    }
}

if (-not $vcvarsPath) {
    throw "Could not find vcvars64.bat for VS $VsVersion. Check VS installation."
}

# --- 3. Build with CMake + NMake ---
Write-Host "`n=== Step 3: Building console_solver ===" -ForegroundColor Cyan

$buildDir = Join-Path (Resolve-Path $RepoDir) "vsbuild"
$repoFullPath = Resolve-Path $RepoDir

if (Test-Path $buildDir) {
    Write-Host "  Cleaning old build dir..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $buildDir
}
New-Item -ItemType Directory -Path $buildDir | Out-Null

# Create a batch file that sets up VS env and runs cmake + nmake
$buildScript = @"
@echo off
call "$vcvarsPath"
cd /d "$buildDir"
cmake "$repoFullPath" -G "NMake Makefiles" -DCMAKE_BUILD_TYPE=Release
if errorlevel 1 exit /b 1
nmake install
if errorlevel 1 exit /b 1
echo BUILD SUCCESS
"@

$buildScriptPath = Join-Path $buildDir "do_build.bat"
$buildScript | Out-File -FilePath $buildScriptPath -Encoding ascii

Write-Host "  Running build (this may take a few minutes)..." -ForegroundColor Yellow
$process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$buildScriptPath`"" -Wait -PassThru -NoNewWindow
if ($process.ExitCode -ne 0) {
    Write-Host "`n  NMake build failed! Trying VS generator fallback..." -ForegroundColor Yellow
    
    # Fallback: use Visual Studio generator
    $buildScript2 = @"
@echo off
call "$vcvarsPath"
cd /d "$buildDir"
cmake "$repoFullPath" -G "Visual Studio 17 2022" -A x64
if errorlevel 1 exit /b 1
cmake --build . --config Release --target install
if errorlevel 1 exit /b 1
echo BUILD SUCCESS
"@
    $buildScriptPath2 = Join-Path $buildDir "do_build_vs.bat"
    $buildScript2 | Out-File -FilePath $buildScriptPath2 -Encoding ascii
    
    $process2 = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$buildScriptPath2`"" -Wait -PassThru -NoNewWindow
    if ($process2.ExitCode -ne 0) {
        throw "Build failed with both NMake and VS generator!"
    }
}

# --- 4. Verify ---
Write-Host "`n=== Step 4: Verifying build ===" -ForegroundColor Cyan

$installDir = Join-Path (Resolve-Path $RepoDir) "install"
$solverExe = Join-Path $installDir "console_solver.exe"
$resourceDir = Join-Path $installDir "resources"

if (Test-Path $solverExe) {
    Write-Host "  console_solver.exe: OK" -ForegroundColor Green
} else {
    throw "console_solver.exe NOT FOUND at $solverExe"
}

if (Test-Path $resourceDir) {
    Write-Host "  resources/: OK" -ForegroundColor Green
} else {
    Write-Host "  resources/ not found, copying manually..." -ForegroundColor Yellow
    Copy-Item -Recurse (Join-Path (Resolve-Path $RepoDir) "resources") $resourceDir
}

Write-Host "`n=== BUILD COMPLETE ===" -ForegroundColor Green
Write-Host "  Solver: $solverExe"
Write-Host "  Resources: $resourceDir"
Write-Host "`nNext step: python batch_solve.py --dry-run"
