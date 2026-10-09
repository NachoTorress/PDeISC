$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$omitDirs = @('node_modules', '.expo', 'dist', 'web-build', 'android', 'ios', '.vercel')
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Copy-ProjectTree([string]$source, [string]$destination) {
    foreach ($item in Get-ChildItem -LiteralPath $source -Force) {
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
        if ($item.PSIsContainer) {
            if ($omitDirs -contains $item.Name) { continue }
            $child = Join-Path $destination $item.Name
            New-Item -ItemType Directory -Path $child | Out-Null
            Copy-ProjectTree $item.FullName $child
        }
        elseif ($item.Name -ne '.env' -and ($item.Name -notlike '.env.*' -or $item.Name -eq '.env.example') -and $item.Extension -notin @('.apk', '.aab')) {
            Copy-Item -LiteralPath $item.FullName -Destination (Join-Path $destination $item.Name)
        }
    }
}

try {
    $versiones = @(Get-ChildItem -LiteralPath $root -Directory |
        Where-Object { $_.Name -match '^BomberMan 0\.\d+$' } |
        Sort-Object { [version]($_.Name -replace '^BomberMan ', '') })
    if ($versiones.Count -eq 0) { throw 'No hay una version anterior para copiar.' }
    $anterior = $versiones[-1]
    $ultimoNumero = [int]($anterior.Name -replace '^BomberMan 0\.', '')
    $sugerida = '0.' + ($ultimoNumero + 1)
    $nueva = Read-Host ("Nueva version [Enter = {0}]" -f $sugerida)
    if ([string]::IsNullOrWhiteSpace($nueva)) { $nueva = $sugerida }
    if ($nueva -notmatch '^0\.(\d+)$' -or [int]$Matches[1] -le $ultimoNumero) {
        throw 'La nueva version debe ser 0.x y mayor que la anterior.'
    }
    $destino = [IO.Path]::GetFullPath((Join-Path $root ("BomberMan {0}" -f $nueva)))
    $raizResuelta = (Resolve-Path -LiteralPath $root).Path
    $origenResuelto = (Resolve-Path -LiteralPath $anterior.FullName).Path
    if (-not $origenResuelto.StartsWith($raizResuelta + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or
        -not $destino.StartsWith($raizResuelta + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'La copia debe permanecer dentro del repositorio.'
    }
    if (Test-Path -LiteralPath $destino) { throw 'Esa version ya existe. No se sobrescribio nada.' }

    New-Item -ItemType Directory -Path $destino | Out-Null
    Copy-ProjectTree $origenResuelto $destino
    $briefDestino = Join-Path $destino 'docs\PROJECT_BRIEF.md'
    Copy-Item -LiteralPath (Join-Path $root 'docs\PROJECT_BRIEF.md') -Destination $briefDestino -Force
    foreach ($parte in @('frontend', 'backend')) {
        $ejemplo = Join-Path $destino "$parte\.env.example"
        if (Test-Path -LiteralPath $ejemplo) {
            Copy-Item -LiteralPath $ejemplo -Destination (Join-Path $destino "$parte\.env")
        }
    }

    $packagePath = Join-Path $destino 'frontend\package.json'
    $package = Get-Content -LiteralPath $packagePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $package.version = "$nueva.0"
    [IO.File]::WriteAllText($packagePath, (($package | ConvertTo-Json -Depth 20) + [Environment]::NewLine), $utf8)

    $lockPath = Join-Path $destino 'frontend\package-lock.json'
    if (Test-Path -LiteralPath $lockPath) {
        $lock = Get-Content -LiteralPath $lockPath -Raw -Encoding UTF8
        $versionesRaiz = [regex]'(?m)^(\s*"version": ")[^"]+("[,])'
        $lock = $versionesRaiz.Replace($lock, ('${1}' + $nueva + '.0${2}'), 2)
        [IO.File]::WriteAllText($lockPath, $lock, $utf8)
    }

    $appPath = Join-Path $destino 'frontend\app.json'
    $app = Get-Content -LiteralPath $appPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $app.expo.version = "$nueva.0"
    $app.expo.android.versionCode = [int]$app.expo.android.versionCode + 1
    [IO.File]::WriteAllText($appPath, (($app | ConvertTo-Json -Depth 20) + [Environment]::NewLine), $utf8)

    Write-Host ("Creada {0} a partir de {1}." -f (Split-Path $destino -Leaf), $anterior.Name) -ForegroundColor Green
    Write-Host 'Trabaja en la carpeta nueva; la anterior queda intacta.'
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
