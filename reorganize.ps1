# Script para reorganizar el proyecto CVR para Railway
Write-Host "Iniciando reorganización del proyecto CVR..." -ForegroundColor Green

# Crear carpetas si no existen
if (!(Test-Path "backend")) { New-Item -ItemType Directory -Name "backend" }
if (!(Test-Path "frontend")) { New-Item -ItemType Directory -Name "frontend" }

Write-Host "Copiando archivos del backend..." -ForegroundColor Yellow

# Copiar archivos del backend (sin node_modules)
$backendFiles = @("*.js", "*.sql", "*.cjs", "*.md", "*.mwb", "*.bak")
foreach ($pattern in $backendFiles) {
    $files = Get-ChildItem "paginacvr\backend\$pattern" -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Copy-Item $file.FullName "backend\" -Force
        Write-Host "Copiado: $($file.Name)" -ForegroundColor Cyan
    }
}

Write-Host "Copiando archivos del frontend..." -ForegroundColor Yellow

# Copiar archivos del frontend
$frontendFiles = @("*.html", "*.json", "*.js", "*.ts", "*.tsx", "*.css", "*.md", "*.yml", "*.bat")
foreach ($pattern in $frontendFiles) {
    $files = Get-ChildItem "paginacvr\$pattern" -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Copy-Item $file.FullName "frontend\" -Force
        Write-Host "Copiado: $($file.Name)" -ForegroundColor Cyan
    }
}

# Copiar carpetas del frontend
$frontendDirs = @("src", "public", "dist")
foreach ($dir in $frontendDirs) {
    if (Test-Path "paginacvr\$dir") {
        Copy-Item "paginacvr\$dir" "frontend\" -Recurse -Force
        Write-Host "Copiado directorio: $dir" -ForegroundColor Cyan
    }
}

Write-Host "Reorganización completada!" -ForegroundColor Green
Write-Host "Estructura creada:" -ForegroundColor Yellow
Write-Host "- backend/ (API Express)" -ForegroundColor White
Write-Host "- frontend/ (React + Vite)" -ForegroundColor White

