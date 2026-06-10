@echo off
rem Start a simple static server and open the friends page
rem Prefer Python's http.server, fall back to npx http-server if Python missing
where python >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" cmd /k "python -m http.server 3000"
) else (
  where npx >nul 2>nul
  if %ERRORLEVEL%==0 (
    start "" cmd /k "npx http-server -p 3000"
  ) else (
    echo Neither python nor npx found. Please install Python or Node.js.
    pause
    exit /b 1
  )
)
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000/html/friends.html"
exit /b 0
