# Instala dependências do backend
Write-Host "📦 Instalando dependências do backend (NestJS)..." -ForegroundColor Cyan
Set-Location backend
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies instaladas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao instalar dependências do backend" -ForegroundColor Red
    exit 1
}

Set-Location ..

# Instala dependências do frontend
Write-Host "`n📦 Instalando dependências do frontend (Angular)..." -ForegroundColor Cyan
Set-Location frontend
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies instaladas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao instalar dependências do frontend" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host "`n🎉 Todas as dependências foram instaladas com sucesso!" -ForegroundColor Green
Write-Host "`n📚 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Execute '.\start-backend.ps1' em um terminal" -ForegroundColor White
Write-Host "   2. Execute '.\start-frontend.ps1' em outro terminal" -ForegroundColor White
Write-Host "   3. Acesse http://localhost:4200 no navegador" -ForegroundColor White
