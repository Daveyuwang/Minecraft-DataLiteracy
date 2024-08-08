@echo off
setlocal enabledelayedexpansion

color 0E
echo Setting up Minecraft Bedrock Dedicated Server...
echo.

:: Check for administrative privileges
NET SESSION >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo This script requires administrative privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

echo Exempting Minecraft from UWP loopback restrictions...
CheckNetIsolation.exe LoopbackExempt -a -p=S-1-15-2-1958404141-86561845-1752920682-3514627264-368642714-62675701-733520436
if %errorLevel% neq 0 (
    color 0C
    echo Failed to exempt Minecraft from loopback restrictions.
    echo Please check your system settings and try again.
    pause
    exit /b 1
)

echo.
echo Retrieving local IPv4 address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "IPv4.*"') do (
    set ip=%%a
    set ip=!ip:~1!
    goto :got_ip
)
:got_ip

if not defined ip (
    color 0C
    echo Failed to retrieve IPv4 address.
    echo Please check your network connection and try again.
    pause
    exit /b 1
)

echo Locating bedrock_server.exe...
if exist "bedrock_server.exe" (
    set "server_exe=bedrock_server.exe"
) else (
    for /r "%~dp0" %%i in (bedrock_server.exe) do (
        if exist "%%i" (
            set "server_exe=%%i"
            goto :found_exe
        )
    )
)

:found_exe
if not defined server_exe (
    color 0C
    echo Error: bedrock_server.exe not found.
    echo Please ensure you have downloaded the Bedrock Dedicated Server files
    echo and placed this script in the same directory or a parent directory.
    pause
    exit /b 1
)

echo Starting Minecraft Bedrock Dedicated Server...
start "" "%server_exe%"

echo.
echo * SERVER SETUP COMPLETE *
echo.
echo Use the following information to connect:
echo ==================================
echo Address to connect: %ip%
echo Port: 19132
echo ==================================
echo.
echo Press any key to exit...
pause >nul