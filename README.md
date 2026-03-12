# Dashboard de Processamento em Tempo Real

## 🎯 Objetivo

Demonstração de arquitetura limpa usando **Strategy Pattern** + **Dependency Injection** no Angular para comunicação transparente entre WebSocket e HTTP Long Polling.

## 🏗️ Arquitetura

### Princípio Fundamental

> **O Dashboard Component NÃO sabe qual protocolo está sendo usado**

Zero `if/else` verificando tipo de conexão. O design utiliza abstrações corretas.

### Estrutura

```
┌─────────────────────────────────────────────┐
│        Dashboard Component                   │
│        (Smart Component)                     │
│                                              │
│  ❌ NÃO conhece WebSocket                   │
│  ❌ NÃO conhece HTTP                         │
│  ✅ Consome DataStreamService               │
└──────────────┬──────────────────────────────┘
               │
               │ Dependency Injection
               ▼
┌──────────────────────────────────────────────┐
│        DataStreamService                      │
│        (Context - Strategy Pattern)           │
│                                              │
│  • Gerencia estratégias                      │
│  • Implementa fallback automático            │
│  • Expõe interface unificada                 │
└─────┬────────────────────────────────┬───────┘
      │                                │
      │ DI                             │ DI
      ▼                                ▼
┌─────────────────────┐    ┌─────────────────────┐
│ WebSocketStrategy   │    │ HttpPollingStrategy │
│ (Concrete Strategy) │    │ (Concrete Strategy) │
│                     │    │                     │
│ • Socket.IO         │    │ • HTTP Long Polling │
│ • Baixa latência    │    │ • Fallback resiliente│
└─────────────────────┘    └─────────────────────┘
```

## 📂 Estrutura de Arquivos

### Backend (NestJS)

```
backend/
├── src/
│   ├── main.ts                          # Bootstrap da aplicação
│   ├── app.module.ts                    # Módulo principal
│   └── processing/
│       ├── processing.module.ts         # Módulo de processamento
│       ├── processing.service.ts        # Lógica de negócio
│       ├── processing.gateway.ts        # WebSocket Gateway
│       ├── processing.controller.ts     # HTTP Long Polling Controller
│       └── interfaces/
│           └── processing.interface.ts  # Tipos compartilhados
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Frontend (Angular)

```
frontend/
├── src/
│   ├── main.ts                                    # Bootstrap
│   ├── index.html                                 # HTML principal
│   ├── styles.scss                                # Estilos globais
│   └── app/
│       ├── app.component.ts                       # Componente raiz
│       ├── core/
│       │   ├── models/
│       │   │   └── processing.model.ts            # Modelos de dados
│       │   ├── strategies/
│       │   │   ├── data-stream.strategy.ts        # Interface Strategy
│       │   │   ├── websocket-stream.strategy.ts   # Implementação WebSocket
│       │   │   └── http-polling-stream.strategy.ts# Implementação HTTP
│       │   └── services/
│       │       └── data-stream.service.ts         # Service (Context)
│       └── features/
│           └── dashboard/
│               ├── dashboard.component.ts         # Smart Component
│               ├── dashboard.component.html       # Template
│               └── dashboard.component.scss       # Estilos
├── package.json
├── tsconfig.json
└── angular.json
```

## 🚀 Como Executar

### 1. Backend (NestJS)

```powershell
cd backend
npm install
npm run start:dev
```

O servidor estará rodando em:
- HTTP: `http://localhost:3000`
- WebSocket: `ws://localhost:3000/processing`

### 2. Frontend (Angular)

```powershell
cd frontend
npm install
ng serve
```

Acesse: `http://localhost:4200`

## 🔑 Conceitos Chave

### 1. Strategy Pattern

```typescript
// Interface abstrata (Strategy)
export abstract class DataStreamStrategy {
  abstract connect(): Observable<boolean>;
  abstract startTask(request: TaskRequest): Observable<ProcessingStatus>;
  // ...
}

// Implementações concretas não são conhecidas pelo componente
class WebSocketStreamStrategy extends DataStreamStrategy { }
class HttpPollingStreamStrategy extends DataStreamStrategy { }
```

### 2. Dependency Injection

```typescript
@Injectable({ providedIn: 'root' })
export class DataStreamService {
  // Angular DI injeta as estratégias automaticamente
  private readonly wsStrategy = inject(WebSocketStreamStrategy);
  private readonly httpStrategy = inject(HttpPollingStreamStrategy);
  
  private currentStrategy: DataStreamStrategy;
}
```

### 3. Transparência no Componente

```typescript
@Component({ /* ... */ })
export class DashboardComponent {
  private readonly dataStreamService = inject(DataStreamService);
  
  startProcessing(): void {
    // ✅ Zero conhecimento sobre WebSocket ou HTTP
    this.dataStreamService.startTask({ taskId })
      .subscribe(status => {
        // Recebe updates independente do protocolo
      });
  }
}
```

### 4. Fallback Automático

```typescript
connect(): Observable<boolean> {
  return this.tryWebSocket().pipe(
    catchError(() => {
      console.log('WebSocket failed, falling back to HTTP Polling');
      return this.fallbackToHttp();
    })
  );
}
```

## 🎨 Features

### Backend

- ✅ WebSocket Gateway com Socket.IO
- ✅ HTTP Long Polling Controller
- ✅ Simulação de processamento com progresso incremental
- ✅ CORS configurado
- ✅ Namespace isolado para WebSocket (`/processing`)

### Frontend

- ✅ Strategy Pattern com abstração total
- ✅ Dependency Injection nativa do Angular
- ✅ Signals (Angular 17+) para state management
- ✅ Material UI com design moderno
- ✅ Fallback automático e transparente
- ✅ Zero acoplamento com protocolo específico
- ✅ Standalone Components

## 🧪 Testando o Fallback

### Cenário 1: WebSocket Disponível
1. Inicie backend e frontend normalmente
2. Observe o chip de status: "Conectado: WebSocket"
3. Inicie uma tarefa - updates em tempo real via WebSocket

### Cenário 2: WebSocket Indisponível
1. Pare o backend
2. Inicie o frontend
3. Observe o fallback automático para "HTTP Long Polling"
4. Inicie o backend novamente
5. As requisições funcionam via HTTP

### Cenário 3: Troca Manual (Demo)
1. Use os botões "WebSocket" e "HTTP Polling"
2. Observe a troca transparente de estratégia
3. O componente continua funcionando identicamente

## 📊 Fluxo de Dados

### WebSocket Flow

```
Dashboard Component
    ↓ startTask()
DataStreamService
    ↓ currentStrategy.startTask()
WebSocketStreamStrategy
    ↓ socket.emit('start-task')
Backend Gateway
    ↓ stream of updates
    ↓ socket.emit('task-progress')
WebSocketStreamStrategy
    ↓ Observable.next(status)
DataStreamService
    ↓ passthrough
Dashboard Component
    ↓ Signal update
UI Update (Material Progress Bar)
```

### HTTP Polling Flow

```
Dashboard Component
    ↓ startTask()
DataStreamService
    ↓ currentStrategy.startTask()
HttpPollingStreamStrategy
    ↓ POST /processing/start
    ↓ interval polling
    ↓ GET /processing/poll/:taskId (every 2s)
Backend Controller
    ↓ Long polling with 30s timeout
HttpPollingStreamStrategy
    ↓ Observable.next(status)
DataStreamService
    ↓ passthrough
Dashboard Component
    ↓ Signal update
UI Update (Material Progress Bar)
```

## 🎓 Lições Arquiteturais

### ❌ Design Ruim (O que NÃO fazer)

```typescript
// EVITE: Componente conhecendo implementações específicas
class DashboardComponent {
  if (this.connectionType === 'websocket') {
    this.socket.emit('start-task');
  } else if (this.connectionType === 'http') {
    this.http.post('/start', data).subscribe();
  }
}
```

### ✅ Design Correto (O que fazer)

```typescript
// CORRETO: Componente depende apenas da abstração
class DashboardComponent {
  startProcessing(): void {
    this.dataStreamService.startTask(request)
      .subscribe(status => this.updateUI(status));
  }
}
```

## 🔧 Tecnologias

### Backend
- NestJS 10
- Socket.IO 4
- RxJS 7
- TypeScript 5

### Frontend
- Angular 17 (Standalone Components)
- Angular Material 17
- Socket.IO Client 4
- RxJS 7
- TypeScript 5

## 📝 Endpoints

### WebSocket (Socket.IO)

**Namespace:** `/processing`

**Events:**
- `start-task` - Inicia processamento
- `task-progress` - Recebe atualizações
- `stop-task` - Para processamento
- `ping/pong` - Health check

### HTTP

**Base URL:** `http://localhost:3000/processing`

**Endpoints:**
- `POST /start` - Inicia tarefa
- `GET /poll/:taskId` - Long polling para updates
- `POST /stop/:taskId` - Para tarefa
- `GET /health` - Health check

## 🎯 Resultados

✅ **Zero acoplamento** entre componente e protocolo  
✅ **Fallback transparente** sem intervenção do componente  
✅ **Testabilidade** perfeita (mock de estratégias)  
✅ **Extensibilidade** fácil (novas estratégias sem alterar componente)  
✅ **Type-safety** completo com TypeScript  
✅ **Performance** otimizada com Signals  

---

**Autor:** Sistema de Dashboard em Tempo Real  
**Pattern:** Strategy + Dependency Injection  
**Framework:** NestJS + Angular 17
