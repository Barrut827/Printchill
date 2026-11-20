@echo off
setlocal
set "target=%LOCALAPPDATA%\Programs\PrintChill"
if not exist "%target%" mkdir "%target%"
for %%F in (node.exe server.mjs store.mjs launch.mjs start.cmd app.js style.css index.html README.md NODE-LICENSE.txt) do (
  copy /Y "%~dp0%%F" "%target%\%%F" >nul || goto failed
)
set "entry=%APPDATA%\Microsoft\Windows\Start Menu\Programs\PrintChill.cmd"
> "%entry%" echo @call "%%LOCALAPPDATA%%\Programs\PrintChill\start.cmd"
if errorlevel 1 goto failed
echo Installed. Open PrintChill from Start or run "%target%\start.cmd".
pause
exit /b 0
:failed
echo Installation failed. You can run start.cmd in the extracted package.
pause
exit /b 1
