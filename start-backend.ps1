Write-Host "🚀 Iniciando Backend (NestJS)..." -ForegroundColor Cyan
Write-Host "📍 Servidor: http://localhost:3000" -ForegroundColor Yellow
Write-Host "🔌 WebSocket: ws://localhost:3000/processing" -ForegroundColor Yellow
Write-Host ""

Set-Location backend
npm run start:dev
