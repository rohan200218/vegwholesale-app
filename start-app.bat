@echo off
echo Starting VegWholesale App...

cd /d C:\Users\Neeha\Downloads\VegWholesale-Source

rem Start Node server in background
start "" cmd /c "npm run dev"

rem Wait 4 seconds for server to start
timeout /t 4 >nul

rem Open browser automatically
start http://localhost:5000

exit
