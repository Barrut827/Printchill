@echo off
setlocal
cd /d "%~dp0"
set "runtime=node.exe"
if exist "%~dp0node.exe" set "runtime=%~dp0node.exe"
"%runtime%" launch.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
start "" "http://127.0.0.1:47831/"
