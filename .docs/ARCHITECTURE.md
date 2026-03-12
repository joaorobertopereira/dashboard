# Arquitetura Detalhada: Strategy Pattern + DI no Angular

## 🎯 O Problema

Você precisa de um Dashboard que receba atualizações em tempo real do backend. A arquitetura definiu:
- **Principal**: WebSocket para baixa latência
- **Fallback**: HTTP Long Polling para resiliência

### ❌ Design Ruim (Acoplamento)

```typescript
class DashboardComponent {
  connectionType: 'websocket' | 'http' = 'websocket';
  
  startTask() {
    if (this.connectionType === 'websocket') {
      this.socket.emit('start-task', data);
      this.socket.on('progress', (update) => {
        this.updateProgress(update);
      });
    } else if (this.connectionType === 'http') {
      this.http.post('/start', data).subscribe();
      setInterval(() => {
        this.http.get('/poll').subscribe(update => {
          this.updateProgress(update);
        });
      }, 2000);
    }
  }
}
```

**Problemas:**
- ✗ Componente conhece detalhes de implementação
- ✗ Lógica de protocolo misturada com lógica de UI
- ✗ Difícil de testar
- ✗ Difícil de adicionar novos protocolos
- ✗ Violação do Single Responsibility Principle

## ✅ Solução: Strategy Pattern + DI

### 1. Definir a Abstração (Interface Strategy)

```typescript
// data-stream.strategy.ts
export abstract class DataStreamStrategy {
  abstract connect(): Observable<boolean>;
  abstract startTask(request: TaskRequest): Observable<ProcessingStatus>;
  abstract stopTask(taskId: string): void;
  abstract isConnected(): boolean;
  abstract getStrategyName(): string;
}
```

**Benefícios:**
- Define o contrato que todas as implementações devem seguir
- Permite que o consumidor dependa apenas da abstração
- Facilita testes com mocks

### 2. Implementações Concretas

#### WebSocket Strategy

```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketStreamStrategy extends DataStreamStrategy {
  private socket: Socket | null = null;
  
  connect(): Observable<boolean> {
    this.socket = io('http://localhost:3000/processing');
    return fromEvent(this.socket, 'connection').pipe(
      map(() => true)
    );
  }
  
  startTask(request: TaskRequest): Observable<ProcessingStatus> {
    return new Observable<ProcessingStatus>((observer) => {
      this.socket!.on('task-progress', (status) => {
        observer.next(status);
      });
      this.socket!.emit('start-task', request);
    });
  }
}
```

#### HTTP Polling Strategy

```typescript
@Injectable({ providedIn: 'root' })
export class HttpPollingStreamStrategy extends DataStreamStrategy {
  constructor(private http: HttpClient) { super(); }
  
  connect(): Observable<boolean> {
    return this.http.get('/health').pipe(map(() => true));
  }
  
  startTask(request: TaskRequest): Observable<ProcessingStatus> {
    const subject = new Subject<ProcessingStatus>();
    
    this.http.post('/start', request).subscribe(() => {
      this.startPolling(request.taskId, subject);
    });
    
    return subject.asObservable();
  }
  
  private startPolling(taskId: string, subject: Subject<ProcessingStatus>) {
    interval(2000).pipe(
      switchMap(() => this.http.get<ProcessingStatus>(`/poll/${taskId}`)),
      takeWhile(status => status.status !== 'completed', true)
    ).subscribe(status => subject.next(status));
  }
}
```

### 3. Context (Service que Gerencia Estratégias)

```typescript
@Injectable({ providedIn: 'root' })
export class DataStreamService {
  // DI do Angular injeta as estratégias
  private readonly wsStrategy = inject(WebSocketStreamStrategy);
  private readonly httpStrategy = inject(HttpPollingStreamStrategy);
  
  private currentStrategy: DataStreamStrategy;
  
  constructor() {
    // Preferência inicial: WebSocket
    this.currentStrategy = this.wsStrategy;
  }
  
  connect(): Observable<boolean> {
    return this.tryWebSocket().pipe(
      catchError(() => this.fallbackToHttp())
    );
  }
  
  startTask(request: TaskRequest): Observable<ProcessingStatus> {
    // O componente não sabe qual estratégia está sendo usada!
    return this.currentStrategy.startTask(request);
  }
  
  private tryWebSocket(): Observable<boolean> {
    this.currentStrategy = this.wsStrategy;
    return this.wsStrategy.connect();
  }
  
  private fallbackToHttp(): Observable<boolean> {
    console.log('Falling back to HTTP Polling');
    this.currentStrategy = this.httpStrategy;
    return this.httpStrategy.connect();
  }
}
```

### 4. Smart Component (Consumidor)

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  // ...
})
export class DashboardComponent {
  // Injeção apenas do service (abstração)
  private readonly dataStreamService = inject(DataStreamService);
  
  readonly processingStatus = signal<ProcessingStatus | null>(null);
  
  ngOnInit(): void {
    // Conecta - não sabemos se é WebSocket ou HTTP
    this.dataStreamService.connect().subscribe();
  }
  
  startProcessing(): void {
    // Inicia tarefa - não sabemos o protocolo!
    this.dataStreamService
      .startTask({ taskId: 'task-123' })
      .subscribe(status => {
        // Recebemos updates identicamente, independente do protocolo
        this.processingStatus.set(status);
      });
  }
}
```

## 🎨 Diagrama de Fluxo

```
┌───────────────────────────────────────────────────┐
│  Dashboard Component (Consumidor)                 │
│                                                   │
│  • Não conhece WebSocket                          │
│  • Não conhece HTTP                               │
│  • Depende apenas de DataStreamService            │
│                                                   │
│  startProcessing() {                              │
│    this.service.startTask(request)                │
│      .subscribe(status => this.update(status));   │
│  }                                                │
└─────────────┬─────────────────────────────────────┘
              │
              │ Dependency Injection
              │ (Angular DI Container)
              ▼
┌─────────────────────────────────────────────────┐
│  DataStreamService (Context)                    │
│                                                 │
│  • Gerencia qual estratégia usar                │
│  • Implementa fallback automático               │
│  • Expõe interface unificada                    │
│                                                 │
│  currentStrategy: DataStreamStrategy            │
│                                                 │
│  connect() {                                    │
│    return tryWebSocket()                        │
│      .catchError(() => fallbackToHttp())        │
│  }                                              │
└────────┬────────────────────────────────┬───────┘
         │                                │
         │ DI                             │ DI
         ▼                                ▼
┌──────────────────────┐      ┌──────────────────────┐
│ WebSocketStrategy    │      │ HttpPollingStrategy  │
│ (Concrete)           │      │ (Concrete)           │
│                      │      │                      │
│ • Socket.IO          │      │ • HTTP Client        │
│ • Real-time push     │      │ • Interval polling   │
│ • Low latency        │      │ • Resilient fallback │
└──────────────────────┘      └──────────────────────┘
```

## 🔑 Princípios Aplicados

### 1. Dependency Inversion Principle (SOLID)

> Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.

- **Alto nível**: DashboardComponent
- **Baixo nível**: WebSocketStrategy, HttpPollingStrategy
- **Abstração**: DataStreamStrategy (interface)

### 2. Open/Closed Principle (SOLID)

> Aberto para extensão, fechado para modificação

Podemos adicionar novas estratégias sem modificar o componente:

```typescript
// Nova estratégia: Server-Sent Events
@Injectable({ providedIn: 'root' })
export class SSEStreamStrategy extends DataStreamStrategy {
  // Implementação usando SSE
}

// No service, apenas adicionar a nova opção
private readonly sseStrategy = inject(SSEStreamStrategy);
```

### 3. Single Responsibility Principle (SOLID)

Cada classe tem UMA responsabilidade:

- **DashboardComponent**: Gerenciar UI e interações do usuário
- **DataStreamService**: Gerenciar estratégias e fallback
- **WebSocketStrategy**: Implementar comunicação via WebSocket
- **HttpPollingStrategy**: Implementar comunicação via HTTP

### 4. Strategy Pattern (GoF)

> Define uma família de algoritmos, encapsula cada um, e os torna intercambiáveis.

As estratégias (WebSocket, HTTP) são intercambiáveis:

```typescript
// Trocar estratégia em runtime
switchStrategy(type: 'websocket' | 'http'): Observable<boolean> {
  this.currentStrategy.disconnect();
  this.currentStrategy = type === 'websocket' 
    ? this.wsStrategy 
    : this.httpStrategy;
  return this.currentStrategy.connect();
}
```

## 🧪 Testabilidade

### Testando o Component

```typescript
describe('DashboardComponent', () => {
  let mockDataStreamService: jasmine.SpyObj<DataStreamService>;
  
  beforeEach(() => {
    mockDataStreamService = jasmine.createSpyObj('DataStreamService', [
      'connect',
      'startTask',
      'stopTask'
    ]);
    
    TestBed.configureTestingModule({
      providers: [
        { provide: DataStreamService, useValue: mockDataStreamService }
      ]
    });
  });
  
  it('should start task without knowing protocol', () => {
    mockDataStreamService.startTask.and.returnValue(of({
      taskId: '123',
      progress: 50,
      status: 'processing',
      message: 'Test',
      timestamp: Date.now()
    }));
    
    component.startProcessing();
    
    expect(mockDataStreamService.startTask).toHaveBeenCalled();
    expect(component.processingStatus()).toBeTruthy();
  });
});
```

### Testando Estratégias Isoladamente

```typescript
describe('WebSocketStreamStrategy', () => {
  it('should connect to WebSocket', (done) => {
    const strategy = new WebSocketStreamStrategy();
    
    strategy.connect().subscribe(connected => {
      expect(connected).toBe(true);
      done();
    });
  });
});
```

## 📊 Comparação

### Antes (Sem Strategy)

```typescript
// 150 linhas no componente
// Lógica de WebSocket + HTTP misturada
// Testes complexos
// Difícil manutenção
```

### Depois (Com Strategy)

```typescript
// 80 linhas no componente (focado em UI)
// Estratégias isoladas (50 linhas cada)
// Service simples (100 linhas)
// Testes unitários simples
// Manutenção fácil
// Extensível
```

## 🎯 Benefícios Finais

✅ **Desacoplamento Total**
- Componente não conhece implementações

✅ **Testabilidade**
- Cada camada testável isoladamente
- Mocks fáceis

✅ **Manutenibilidade**
- Mudanças em um protocolo não afetam outros
- Código organizado e coeso

✅ **Extensibilidade**
- Adicionar novos protocolos é trivial
- Sem modificar código existente

✅ **Type Safety**
- TypeScript garante contratos
- Erros em compile-time

✅ **Performance**
- Signals para otimização de change detection
- Observables para streams eficientes

---

Esta arquitetura é **production-ready** e segue as melhores práticas de Angular e design patterns.
