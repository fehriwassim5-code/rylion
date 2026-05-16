$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "Starting relionimmo on http://localhost:3000" -ForegroundColor Cyan
Write-Host "If port 3000 is busy, the server will retry on http://localhost:3001" -ForegroundColor DarkCyan
node server.js
