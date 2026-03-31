@echo off
echo Starting EduAid Government Portal...

echo Starting Backend Server on port 5000...
start "Backend Server" cmd /k "cd backend && node server.js"

echo Starting Frontend Server on port 3000...
start "Frontend Application" cmd /k "cd frontend && npm start"

echo.
echo Both servers are booting up in separate command windows.
echo The frontend will automatically open http://localhost:3000 in your browser.
pause
