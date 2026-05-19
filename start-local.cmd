@echo off
cd /d "%~dp0"
echo Starting relionimmo on http://localhost:3000
echo If port 3000 is busy, the server will retry on http://localhost:3001
node server.js
