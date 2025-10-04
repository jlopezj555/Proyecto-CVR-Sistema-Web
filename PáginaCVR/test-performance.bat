@echo off
echo ========================================
echo    PRUEBAS DE RENDIMIENTO CVR
echo ========================================

echo.
echo 1. Instalando dependencias de testing...
call npm install --save-dev autocannon

echo.
echo 2. Verificando Artillery...
artillery --version

echo.
echo 3. Ejecutando pruebas de rendimiento...
node test-simple.js

echo.
echo 4. Mostrando reportes...
if exist artillery-report.json (
    echo ✅ Reporte de Artillery generado
) else (
    echo ❌ No se generó reporte de Artillery
)

if exist simple-performance-report.json (
    echo ✅ Reporte de rendimiento generado
) else (
    echo ❌ No se generó reporte de rendimiento
)

echo.
echo ========================================
echo    PRUEBAS COMPLETADAS
echo ========================================
pause