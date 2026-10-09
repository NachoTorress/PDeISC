param([string]$Version, [string]$Action)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Get-Versiones {
    @(Get-ChildItem -LiteralPath $root -Directory |
        Where-Object { $_.Name -match '^BomberMan 0\.\d+$' } |
        Sort-Object { [version]($_.Name -replace '^BomberMan ', '') })
}

function Ensure-Dependencies([string]$frontend, [string]$version, [bool]$force) {
    $modules = Join-Path $frontend 'node_modules'
    $sourcePackage = Join-Path $frontend 'package.json'
    $sourceLock = Join-Path $frontend 'package-lock.json'
    $cacheBase = Join-Path $env:LOCALAPPDATA 'BomberMan\dependencies'
    $cache = Join-Path $cacheBase $version
    $cachePackage = Join-Path $cache 'package.json'
    $cacheLock = Join-Path $cache 'package-lock.json'
    $cacheExpo = Join-Path $cache 'node_modules\.bin\expo.cmd'

    if (-not (Test-Path -LiteralPath $cache)) { New-Item -ItemType Directory -Path $cache -Force | Out-Null }
    $baseResolved = (Resolve-Path -LiteralPath $cacheBase).Path
    $cacheResolved = (Resolve-Path -LiteralPath $cache).Path
    if (-not $cacheResolved.StartsWith($baseResolved + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'La cache de dependencias tiene una ruta invalida.'
    }

    $needsInstall = $force
    if (-not (Test-Path -LiteralPath $cacheExpo)) { $needsInstall = $true }
    if (-not (Test-Path -LiteralPath $cachePackage)) {
        $needsInstall = $true
    }
    elseif ((Get-FileHash -LiteralPath $sourcePackage).Hash -ne (Get-FileHash -LiteralPath $cachePackage).Hash) {
        $needsInstall = $true
    }
    if (Test-Path -LiteralPath $sourceLock) {
        if (-not (Test-Path -LiteralPath $cacheLock)) {
            $needsInstall = $true
        }
        elseif ((Get-FileHash -LiteralPath $sourceLock).Hash -ne (Get-FileHash -LiteralPath $cacheLock).Hash) {
            $needsInstall = $true
        }
    }

    if ($needsInstall) {
        Write-Host 'Instalando dependencias fuera de OneDrive...' -ForegroundColor Cyan
        Copy-Item -LiteralPath $sourcePackage -Destination $cachePackage -Force
        if (Test-Path -LiteralPath $sourceLock) { Copy-Item -LiteralPath $sourceLock -Destination $cacheLock -Force }
        Push-Location -LiteralPath $cache
        try {
            if (Test-Path -LiteralPath $sourceLock) { & npm.cmd ci --no-audit --no-fund }
            else { & npm.cmd install --no-audit --no-fund }
            if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias. Revisa la conexion a internet.' }
        }
        finally { Pop-Location }
    }

    $existing = Get-Item -LiteralPath $modules -Force -ErrorAction SilentlyContinue
    $expectedModules = [IO.Path]::GetFullPath((Join-Path $cache 'node_modules'))
    $sameTarget = $false
    if ($existing) {
        $isJunction = ($existing.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
        if ($isJunction -and $existing.Target) {
            $sameTarget = [IO.Path]::GetFullPath($existing.Target) -eq $expectedModules
        }
    }
    if ($sameTarget -and (Test-Path -LiteralPath (Join-Path $modules '.bin\expo.cmd'))) { return }
    if ($existing) {
        $workspaceResolved = (Resolve-Path -LiteralPath $root).Path
        $modulePath = [IO.Path]::GetFullPath($modules)
        if (-not $modulePath.StartsWith($workspaceResolved + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            throw 'node_modules fuera del repositorio; no se eliminara.'
        }
        if (($existing.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            [IO.Directory]::Delete($modules)
        }
        else {
            Remove-Item -LiteralPath $modules -Recurse -Force
        }
    }
    New-Item -ItemType Junction -Path $modules -Target (Join-Path $cache 'node_modules') | Out-Null
}

try {
    $versiones = Get-Versiones
    if ($versiones.Count -eq 0) { throw 'No se encontraron carpetas BomberMan 0.x en la raiz.' }
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'No se encontro npm. Instala Node.js y vuelve a intentar.' }

    Write-Host ''
    Write-Host 'Versiones disponibles:' -ForegroundColor Cyan
    for ($i = 0; $i -lt $versiones.Count; $i++) {
        Write-Host ("  {0}. {1}" -f ($i + 1), $versiones[$i].Name)
    }
    $numero = 0
    if ($Version) {
        for ($i = 0; $i -lt $versiones.Count; $i++) {
            if ($versiones[$i].Name -eq "BomberMan $Version") { $numero = $i + 1 }
        }
        if ($numero -eq 0) { throw 'La version indicada no existe.' }
    }
    else {
        $seleccion = Read-Host ("Elige una version [Enter = {0}]" -f $versiones.Count)
        if ([string]::IsNullOrWhiteSpace($seleccion)) { $numero = $versiones.Count }
        elseif (-not [int]::TryParse($seleccion, [ref]$numero) -or $numero -lt 1 -or $numero -gt $versiones.Count) {
            throw 'Numero de version no valido.'
        }
    }
    $proyecto = $versiones[$numero - 1]
    $frontend = Join-Path $proyecto.FullName 'frontend'
    if (-not (Test-Path -LiteralPath (Join-Path $frontend 'package.json'))) { throw 'Esta version no tiene frontend/package.json.' }

    Write-Host ''
    Write-Host ("Proyecto: {0}" -f $proyecto.Name) -ForegroundColor Cyan
    Write-Host '  1. Abrir en web'
    Write-Host '  2. Abrir Android con tunel'
    Write-Host '  3. Probar motor del juego'
    Write-Host '  4. Instalar o actualizar dependencias'
    Write-Host '  0. Salir'
    $acciones = @{ web = '1'; android = '2'; test = '3'; install = '4' }
    if ($Action) { $accion = $acciones[$Action] }
    else { $accion = Read-Host 'Elige una opcion' }
    if ($accion -eq '0') { exit 0 }
    if ($accion -notin @('1', '2', '3', '4')) { throw 'Opcion no valida.' }

    Push-Location -LiteralPath $frontend
    try {
        if ($accion -in @('1', '2', '4')) { Ensure-Dependencies $frontend ($proyecto.Name -replace '^BomberMan ', '') ($accion -eq '4') }
        if ($accion -eq '1') { & npm.cmd run web }
        if ($accion -eq '2') { & npm.cmd run tunnel }
        if ($accion -eq '3') { & npm.cmd run test:engine }
        if ($accion -in @('1', '2', '3') -and $LASTEXITCODE -ne 0) { throw 'El comando termino con un error.' }
    }
    finally { Pop-Location }
}
catch {
    Write-Host ''
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
