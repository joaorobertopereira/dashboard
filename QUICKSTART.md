# Projeto Dashboard - Strategy Pattern + DI

Aplicação completa demonstrando **Strategy Pattern** com **Dependency Injection** no Angular para comunicação transparente entre WebSocket e HTTP Long Polling.

## 🚀 Quick Start

### 1. Instalar Dependências

```powershell
.\install.ps1
```

### 2. Iniciar Backend

Em um terminal:

```powershell
.\start-backend.ps1
```

### 3. Iniciar Frontend

Em outro terminal:

```powershell
.\start-frontend.ps1
```

### 4. Acessar

Abra o navegador em: **http://localhost:4200**

## 📚 Documentação

- [README.md](README.md) - Visão geral completa
- [INSTALLATION.md](INSTALLATION.md) - Guia de instalação detalhado
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura detalhada
- [VISUAL-GUIDE.md](VISUAL-GUIDE.md) - Guia visual em ASCII

## 🎯 Conceitos Demonstrados

✅ Strategy Pattern  
✅ Dependency Injection (Angular DI)  
✅ Fallback automático transparente  
✅ WebSocket com Socket.IO  
✅ HTTP Long Polling  
✅ Material UI  
✅ Angular Signals  
✅ Standalone Components  
✅ SOLID Principles  

## 🏗️ Estrutura

```
dashboard/
├── backend/          # NestJS Backend
│   └── src/
│       └── processing/
├── frontend/         # Angular Frontend
│   └── src/
│       └── app/
│           ├── core/
│           │   ├── strategies/
│           │   └── services/
│           └── features/
│               └── dashboard/
├── install.ps1       # Script de instalação
├── start-backend.ps1 # Inicia backend
└── start-frontend.ps1# Inicia frontend
```

## ⚡ Tecnologias

**Backend:** NestJS 10, Socket.IO 4, RxJS 7  
**Frontend:** Angular 17, Material UI 17, Socket.IO Client 4

---

**Pattern:** Strategy + Dependency Injection  
**Author:** Dashboard em Tempo Real
