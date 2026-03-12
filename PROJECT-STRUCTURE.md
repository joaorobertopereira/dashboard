# Estrutura Completa do Projeto

```
dashboard/
│
├── 📁 backend/                           # NestJS Backend
│   │
│   ├── 📁 src/
│   │   ├── 📄 main.ts                    # Bootstrap da aplicação
│   │   ├── 📄 app.module.ts              # Módulo principal
│   │   │
│   │   └── 📁 processing/                # Módulo de processamento
│   │       ├── 📄 processing.module.ts   # Module (registra providers)
│   │       ├── 📄 processing.service.ts  # Service (lógica de negócio)
│   │       ├── 📄 processing.gateway.ts  # WebSocket Gateway (Socket.IO)
│   │       ├── 📄 processing.controller.ts # HTTP Controller (Long Polling)
│   │       │
│   │       └── 📁 interfaces/
│   │           └── 📄 processing.interface.ts # Tipos e interfaces
│   │
│   ├── 📄 package.json                   # Dependencies (NestJS, Socket.IO, RxJS)
│   ├── 📄 tsconfig.json                  # TypeScript config
│   ├── 📄 nest-cli.json                  # Nest CLI config
│   └── 📄 .gitignore
│
├── 📁 frontend/                          # Angular Frontend
│   │
│   ├── 📁 src/
│   │   ├── 📄 index.html                 # HTML principal
│   │   ├── 📄 main.ts                    # Bootstrap Angular
│   │   ├── 📄 styles.scss                # Estilos globais
│   │   │
│   │   └── 📁 app/
│   │       ├── 📄 app.component.ts       # Root component
│   │       │
│   │       ├── 📁 core/                  # Core module (singleton services)
│   │       │   │
│   │       │   ├── 📁 models/
│   │       │   │   └── 📄 processing.model.ts       # Modelos de dados
│   │       │   │
│   │       │   ├── 📁 strategies/                   # Strategy Pattern
│   │       │   │   ├── 📄 data-stream.strategy.ts   # Interface (Abstract Class)
│   │       │   │   ├── 📄 websocket-stream.strategy.ts # Implementação WebSocket
│   │       │   │   └── 📄 http-polling-stream.strategy.ts # Implementação HTTP
│   │       │   │
│   │       │   └── 📁 services/
│   │       │       └── 📄 data-stream.service.ts    # Context (gerencia estratégias)
│   │       │
│   │       └── 📁 features/                         # Features modules
│   │           └── 📁 dashboard/
│   │               ├── 📄 dashboard.component.ts    # Smart Component
│   │               ├── 📄 dashboard.component.html  # Template
│   │               └── 📄 dashboard.component.scss  # Estilos
│   │
│   ├── 📄 package.json                   # Dependencies (Angular, Material, Socket.IO)
│   ├── 📄 tsconfig.json                  # TypeScript config (com path aliases)
│   ├── 📄 tsconfig.app.json              # App-specific TS config
│   ├── 📄 angular.json                   # Angular CLI config
│   └── 📄 .gitignore
│
├── 📁 .github/                           # GitHub config
│   └── 📁 skills/                        # Skills (attached folders)
│       ├── 📁 angular-best-practices/
│       ├── 📁 angular-state-management/
│       ├── 📁 angular-ui-patterns/
│       ├── 📁 api-patterns/
│       ├── 📁 backend-architect/
│       ├── 📁 brainstorming/
│       ├── 📁 frontend-design/
│       ├── 📁 nestjs-expert/
│       ├── 📁 nodejs-backend-patterns/
│       └── 📁 nodejs-best-practices/
│
├── 📄 README.md                          # Documentação principal completa
├── 📄 QUICKSTART.md                      # Guia rápido de início
├── 📄 INSTALLATION.md                    # Instruções de instalação
├── 📄 ARCHITECTURE.md                    # Arquitetura detalhada
├── 📄 VISUAL-GUIDE.md                    # Guia visual em ASCII
├── 📄 TESTING.md                         # Testes e demonstrações
├── 📄 PROJECT-STRUCTURE.md               # Este arquivo
│
├── 📄 install.ps1                        # Script: instala dependências
├── 📄 start-backend.ps1                  # Script: inicia backend
└── 📄 start-frontend.ps1                 # Script: inicia frontend
```

---

## 📦 Descrição dos Arquivos Principais

### Backend

| Arquivo | Responsabilidade | LOC |
|---------|------------------|-----|
| `main.ts` | Bootstrap da aplicação NestJS | ~15 |
| `app.module.ts` | Módulo raiz | ~8 |
| `processing.service.ts` | Lógica de processamento, gerencia streams | ~120 |
| `processing.gateway.ts` | WebSocket Gateway (Socket.IO) | ~100 |
| `processing.controller.ts` | HTTP Long Polling endpoints | ~110 |
| `processing.module.ts` | Module definition | ~10 |
| `processing.interface.ts` | TypeScript interfaces | ~15 |

**Total Backend:** ~378 LOC

### Frontend

| Arquivo | Responsabilidade | LOC |
|---------|------------------|-----|
| `main.ts` | Bootstrap Angular | ~12 |
| `app.component.ts` | Root component | ~15 |
| `processing.model.ts` | Modelos de dados | ~12 |
| `data-stream.strategy.ts` | Interface Strategy (abstração) | ~25 |
| `websocket-stream.strategy.ts` | Implementação WebSocket | ~120 |
| `http-polling-stream.strategy.ts` | Implementação HTTP | ~150 |
| `data-stream.service.ts` | Context (gerencia estratégias) | ~150 |
| `dashboard.component.ts` | Smart Component | ~170 |
| `dashboard.component.html` | Template Material UI | ~180 |
| `dashboard.component.scss` | Estilos customizados | ~200 |

**Total Frontend:** ~1,034 LOC

---

## 🎯 Princípios de Organização

### 1. Separation of Concerns

```
Core/        → Serviços singleton, lógica compartilhada
Features/    → Componentes de features específicas
Shared/      → Componentes/pipes/directives reutilizáveis (não usado neste projeto)
```

### 2. Strategy Pattern Files

```
strategies/
├── data-stream.strategy.ts          ← Interface (contrato)
├── websocket-stream.strategy.ts     ← Implementação 1
└── http-polling-stream.strategy.ts  ← Implementação 2
```

### 3. Single Responsibility

Cada arquivo tem UMA responsabilidade:
- `*.strategy.ts` → Implementa protocolo de comunicação
- `*.service.ts` → Gerencia estratégias ou lógica de negócio
- `*.component.ts` → Gerencia UI e interações
- `*.gateway.ts` → Gerencia WebSocket
- `*.controller.ts` → Gerencia HTTP

---

## 🔍 Path Aliases (TypeScript)

Configurados em `frontend/tsconfig.json`:

```typescript
"paths": {
  "@core/*": ["src/app/core/*"],
  "@features/*": ["src/app/features/*"],
  "@shared/*": ["src/app/shared/*"]
}
```

**Uso:**

```typescript
// ❌ Ruim - caminhos relativos confusos
import { DataStreamService } from '../../../core/services/data-stream.service';

// ✅ Bom - path alias limpo
import { DataStreamService } from '@core/services/data-stream.service';
```

---

## 📊 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Total de arquivos TS | 14 |
| Total de LOC (TypeScript) | ~1,412 |
| Total de LOC (HTML) | ~180 |
| Total de LOC (SCSS) | ~200 |
| Componentes | 2 (App, Dashboard) |
| Services | 4 (Backend Service + 3 Frontend) |
| Estratégias | 2 (WebSocket, HTTP) |
| Módulos NestJS | 2 (App, Processing) |
| Documentação | 7 arquivos MD |

---

## 🎨 Convenções de Nomenclatura

### Backend (NestJS)

- **Modules:** `*.module.ts`
- **Services:** `*.service.ts`
- **Controllers:** `*.controller.ts`
- **Gateways:** `*.gateway.ts`
- **Interfaces:** `*.interface.ts`

### Frontend (Angular)

- **Components:** `*.component.ts`
- **Services:** `*.service.ts`
- **Strategies:** `*.strategy.ts`
- **Models:** `*.model.ts`
- **Templates:** `*.component.html`
- **Styles:** `*.component.scss`

---

## 🔐 Arquivos Ignorados (.gitignore)

```
node_modules/      # Dependencies
dist/              # Build output
.angular/          # Angular cache
*.log              # Logs
.env               # Environment vars
.vscode/           # IDE config
```

---

## 📝 Documentação

| Arquivo | Conteúdo |
|---------|----------|
| `README.md` | Visão geral completa, arquitetura, endpoints, exemplos |
| `QUICKSTART.md` | Guia rápido para iniciar o projeto |
| `INSTALLATION.md` | Instruções passo a passo de instalação |
| `ARCHITECTURE.md` | Explicação detalhada da arquitetura e padrões |
| `VISUAL-GUIDE.md` | Diagramas ASCII da arquitetura |
| `TESTING.md` | Cenários de teste e exemplos de testes unitários |
| `PROJECT-STRUCTURE.md` | Este arquivo - estrutura e organização |

---

## 🚀 Scripts PowerShell

| Script | Função |
|--------|--------|
| `install.ps1` | Instala dependências backend + frontend |
| `start-backend.ps1` | Inicia servidor NestJS em modo dev |
| `start-frontend.ps1` | Inicia servidor Angular com auto-open |

---

## 🎓 Para Estudar o Código

### Ordem Recomendada:

1. **Leia primeiro:**
   - `README.md` → Visão geral
   - `ARCHITECTURE.md` → Entenda os padrões

2. **Backend (ordem):**
   - `processing.interface.ts` → Tipos
   - `processing.service.ts` → Lógica
   - `processing.gateway.ts` → WebSocket
   - `processing.controller.ts` → HTTP

3. **Frontend (ordem):**
   - `processing.model.ts` → Tipos
   - `data-stream.strategy.ts` → Interface
   - `websocket-stream.strategy.ts` → Implementação 1
   - `http-polling-stream.strategy.ts` → Implementação 2
   - `data-stream.service.ts` → Context
   - `dashboard.component.ts` → Consumidor

4. **Execute e teste:**
   - Siga `TESTING.md` para cenários práticos

---

## 💡 Extensões Sugeridas (VS Code)

- **Angular Language Service** - Suporte a templates
- **ESLint** - Linting
- **Prettier** - Formatação
- **TypeScript Hero** - Organize imports
- **Material Icon Theme** - Icons bonitos
- **GitLens** - Git superpowers

---

## 📚 Referências

- [Design Patterns - Gang of Four](https://refactoring.guru/design-patterns/strategy)
- [Angular Dependency Injection](https://angular.io/guide/dependency-injection)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**Projeto criado seguindo as melhores práticas de arquitetura limpa e design patterns.**
