# Guia Visual - Strategy Pattern + DI

## 📊 Visão Geral da Arquitetura

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    CAMADA DE APRESENTAÇÃO                     ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐  ┃
┃  │         Dashboard Component (Smart Component)          │  ┃
┃  │                                                         │  ┃
┃  │  • Material UI (Cards, Progress Bar, Buttons)          │  ┃
┃  │  • Signals para state management                       │  ┃
┃  │  • Reactive UI updates                                 │  ┃
┃  │  • ZERO conhecimento sobre protocolos                  │  ┃
┃  │                                                         │  ┃
┃  │  startProcessing() {                                   │  ┃
┃  │    this.dataStreamService                              │  ┃
┃  │      .startTask(request)                               │  ┃
┃  │      .subscribe(status => update UI)                   │  ┃
┃  │  }                                                      │  ┃
┃  └────────────────────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          │
                          │ Dependency Injection (Angular DI)
                          │ inject(DataStreamService)
                          ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    CAMADA DE SERVIÇO (CONTEXT)                ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐  ┃
┃  │              DataStreamService                          │  ┃
┃  │              (Strategy Context)                         │  ┃
┃  │                                                         │  ┃
┃  │  Responsabilidades:                                     │  ┃
┃  │  ✓ Gerenciar qual estratégia usar                      │  ┃
┃  │  ✓ Implementar fallback automático                     │  ┃
┃  │  ✓ Expor interface unificada                           │  ┃
┃  │  ✓ Abstrair complexidade de protocolos                 │  ┃
┃  │                                                         │  ┃
┃  │  private currentStrategy: DataStreamStrategy;          │  ┃
┃  │                                                         │  ┃
┃  │  connect() {                                           │  ┃
┃  │    return this.tryWebSocket()                          │  ┃
┃  │      .pipe(                                            │  ┃
┃  │        catchError(() => this.fallbackToHttp())        │  ┃
┃  │      );                                                │  ┃
┃  │  }                                                      │  ┃
┃  └────────────────────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━┛
                          │              │
        ┌─────────────────┘              └────────────────┐
        │ DI                                              │ DI
        │ inject(WebSocketStreamStrategy)                │ inject(HttpPollingStreamStrategy)
        ▼                                                 ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     ESTRATÉGIA CONCRETA 1    ┃        ┃     ESTRATÉGIA CONCRETA 2    ┃
┃                              ┃        ┃                              ┃
┃ ┌──────────────────────────┐ ┃        ┃ ┌──────────────────────────┐ ┃
┃ │ WebSocketStreamStrategy  │ ┃        ┃ │ HttpPollingStreamStrategy│ ┃
┃ │ extends DataStreamStrategy│ ┃        ┃ │ extends DataStreamStrategy│ ┃
┃ └──────────────────────────┘ ┃        ┃ └──────────────────────────┘ ┃
┃                              ┃        ┃                              ┃
┃  Tecnologia:                 ┃        ┃  Tecnologia:                 ┃
┃  • Socket.IO Client          ┃        ┃  • HttpClient (Angular)      ┃
┃  • Real-time bidirectional   ┃        ┃  • Interval-based polling    ┃
┃                              ┃        ┃                              ┃
┃  Vantagens:                  ┃        ┃  Vantagens:                  ┃
┃  ✓ Baixa latência            ┃        ┃  ✓ Funciona em qualquer rede ┃
┃  ✓ Push automático           ┃        ┃  ✓ Compatível com proxies    ┃
┃  ✓ Eficiência de banda       ┃        ┃  ✓ Fallback confiável        ┃
┃                              ┃        ┃                              ┃
┃  connect() {                 ┃        ┃  connect() {                 ┃
┃    this.socket = io(url);    ┃        ┃    return this.http          ┃
┃    return fromEvent(         ┃        ┃      .get('/health')         ┃
┃      this.socket,             ┃        ┃      .pipe(...)              ┃
┃      'connection'             ┃        ┃  }                           ┃
┃    );                        ┃        ┃                              ┃
┃  }                           ┃        ┃  startTask(request) {        ┃
┃                              ┃        ┃    this.http.post(...)       ┃
┃  startTask(request) {        ┃        ┃      .subscribe(() => {      ┃
┃    return new Observable(    ┃        ┃        this.startPolling()   ┃
┃      observer => {            ┃        ┃      });                     ┃
┃        this.socket.on(        ┃        ┃    return subject;           ┃
┃          'task-progress',     ┃        ┃  }                           ┃
┃          data => observer     ┃        ┃                              ┃
┃            .next(data)        ┃        ┃  private startPolling() {    ┃
┃        );                     ┃        ┃    interval(2000).pipe(      ┃
┃        this.socket.emit(...)  ┃        ┃      switchMap(() =>         ┃
┃      }                        ┃        ┃        this.http.get(...)    ┃
┃    );                        ┃        ┃      )                        ┃
┃  }                           ┃        ┃    ).subscribe(...)          ┃
┃                              ┃        ┃  }                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        │                                                 │
        └─────────────────┬───────────────────────────────┘
                          │
                          ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                       BACKEND (NestJS)                        ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐  ┃
┃  │                 Processing Module                       │  ┃
┃  │                                                         │  ┃
┃  │  ┌──────────────────────┐  ┌──────────────────────┐   │  ┃
┃  │  │ ProcessingGateway    │  │ ProcessingController │   │  ┃
┃  │  │ (WebSocket)          │  │ (HTTP)               │   │  ┃
┃  │  │                      │  │                      │   │  ┃
┃  │  │ @WebSocketGateway    │  │ @Controller         │   │  ┃
┃  │  │                      │  │                      │   │  ┃
┃  │  │ handleStartTask()    │  │ startTask()          │   │  ┃
┃  │  │ emit('task-progress')│  │ pollTask()           │   │  ┃
┃  │  └──────────────────────┘  └──────────────────────┘   │  ┃
┃  │                    │                  │                │  ┃
┃  │                    └────────┬─────────┘                │  ┃
┃  │                             ▼                          │  ┃
┃  │                  ┌─────────────────────┐              │  ┃
┃  │                  │ ProcessingService   │              │  ┃
┃  │                  │                     │              │  ┃
┃  │                  │ • Lógica de negócio │              │  ┃
┃  │                  │ • Simula processo   │              │  ┃
┃  │                  │ • Gerencia streams  │              │  ┃
┃  │                  └─────────────────────┘              │  ┃
┃  └────────────────────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## 🔄 Fluxo de Decisão - Fallback Automático

```
         Aplicação Inicia
               │
               ▼
     ┌─────────────────────┐
     │   connect()         │
     │   DataStreamService │
     └──────────┬──────────┘
                │
                ▼
     ┌──────────────────────┐
     │ Tentar WebSocket     │
     │ tryWebSocket()       │
     └──────────┬───────────┘
                │
         ┌──────┴──────┐
         │             │
     Sucesso?          │
         │             │
    ┌────┴────┐    ┌───┴────┐
    │   SIM   │    │  NÃO   │
    └────┬────┘    └───┬────┘
         │             │
         ▼             ▼
┌─────────────────┐ ┌──────────────────────┐
│ WebSocket Ativo │ │ catchError()         │
│                 │ │ fallbackToHttp()     │
│ ✓ Conectado     │ │                      │
│ ✓ Baixa latency │ │ Tentando HTTP Polling│
│ ✓ Real-time     │ └──────────┬───────────┘
└────────┬────────┘            │
         │              ┌──────┴──────┐
         │              │             │
         │          Sucesso?          │
         │              │             │
         │         ┌────┴────┐   ┌────┴────┐
         │         │   SIM   │   │   NÃO   │
         │         └────┬────┘   └────┬────┘
         │              │             │
         │              ▼             ▼
         │      ┌─────────────────┐  ┌──────────────┐
         │      │ HTTP Ativo      │  │ ERRO FATAL   │
         │      │                 │  │              │
         │      │ ⚠ Fallback ativo│  │ Sem conexão  │
         │      │ ⚠ Maior latency │  │              │
         │      │ ✓ Resiliente    │  └──────────────┘
         │      └────────┬────────┘
         │               │
         └───────────────┴───────────────┐
                                         │
                                         ▼
                            ┌─────────────────────────┐
                            │ APLICAÇÃO FUNCIONANDO   │
                            │                         │
                            │ Component recebe        │
                            │ updates sem saber       │
                            │ qual protocolo está     │
                            │ sendo usado             │
                            └─────────────────────────┘
```

## 🎭 Padrão Strategy - Anatomia

```
┌─────────────────────────────────────────────────────────────┐
│                    Strategy Pattern                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Interface/Abstract Class                      │ │
│  │         DataStreamStrategy                              │ │
│  │                                                         │ │
│  │  • Define o CONTRATO                                   │ │
│  │  • Métodos abstratos que todas as                     │ │
│  │    implementações devem ter                            │ │
│  │                                                         │ │
│  │  abstract connect(): Observable<boolean>;             │ │
│  │  abstract startTask(): Observable<Status>;            │ │
│  │  abstract stopTask(id): void;                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                          △                                   │
│                          │                                   │
│                          │ implements                        │
│                          │                                   │
│         ┌────────────────┴────────────────┐                 │
│         │                                  │                 │
│  ┌──────┴──────────┐            ┌─────────┴────────┐       │
│  │ WebSocketStream │            │ HttpPollingStream│       │
│  │ Strategy         │            │ Strategy         │       │
│  │                 │            │                  │       │
│  │ Implementação   │            │ Implementação    │       │
│  │ CONCRETA usando │            │ CONCRETA usando  │       │
│  │ Socket.IO       │            │ HttpClient       │       │
│  └─────────────────┘            └──────────────────┘       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Context                              │ │
│  │              DataStreamService                          │ │
│  │                                                         │ │
│  │  • Mantém referência para estratégia atual            │ │
│  │  • Delega chamadas para a estratégia                  │ │
│  │  • Client (Component) interage com Context,           │ │
│  │    não com estratégias diretamente                    │ │
│  │                                                         │ │
│  │  private currentStrategy: DataStreamStrategy;         │ │
│  │                                                         │ │
│  │  startTask(request) {                                 │ │
│  │    return this.currentStrategy.startTask(request);    │ │
│  │  }                                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Dependency Injection Flow

```
┌──────────────────────────────────────────────────────────────┐
│              Angular DI Container                             │
│                                                               │
│  Gerencia a criação e injeção de dependências                │
│  automaticamente com base nos decoradores @Injectable        │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ Registra Providers
                          ▼
            ┌─────────────────────────────┐
            │  @Injectable({ providedIn: 'root' })
            │         ▼                    │
            │  ┌──────────────────┐       │
            │  │ WebSocketStrategy│       │
            │  └──────────────────┘       │
            │                             │
            │  ┌──────────────────┐       │
            │  │ HttpStrategy     │       │
            │  └──────────────────┘       │
            │                             │
            │  ┌──────────────────┐       │
            │  │ DataStreamService│       │
            │  └──────────────────┘       │
            └─────────────────────────────┘
                          │
                          │ inject()
                          ▼
            ┌─────────────────────────────┐
            │  DashboardComponent         │
            │                             │
            │  private readonly service = │
            │    inject(DataStreamService)│
            │                             │
            │  ▲ Angular DI injeta        │
            │    automaticamente          │
            └─────────────────────────────┘
```

## 📦 Estrutura de Dados - Fluxo

```
Backend                    Strategy                  Component
   │                          │                          │
   │  ProcessingStatus        │                          │
   │  {                       │                          │
   │    taskId: "123",        │                          │
   │    progress: 50,         │                          │
   │    status: "processing", │                          │
   │    message: "...",       │                          │
   │    timestamp: 12345      │                          │
   │  }                       │                          │
   │                          │                          │
   ├──────────────────────────▶ Observable.next(status) │
   │  (via WebSocket.emit     │                          │
   │   ou HTTP response)      │                          │
   │                          │                          │
   │                          ├──────────────────────────▶
   │                          │  Observer recebe         │
   │                          │                          │
   │                          │                    signal.set(status)
   │                          │                          │
   │                          │                    UI Update!
   │                          │                    ┌──────────────┐
   │                          │                    │ Progress Bar │
   │                          │                    │ 50%          │
   │                          │                    └──────────────┘
```

## 🎯 Princípios SOLID Aplicados

```
┌─────────────────────────────────────────────────────────────┐
│ S - Single Responsibility Principle                         │
├─────────────────────────────────────────────────────────────┤
│  ✓ Component: Apenas gerencia UI                           │
│  ✓ Service: Apenas gerencia estratégias                    │
│  ✓ Strategy: Apenas implementa protocolo específico        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ O - Open/Closed Principle                                   │
├─────────────────────────────────────────────────────────────┤
│  ✓ Aberto para extensão: Adicionar SSEStrategy             │
│  ✓ Fechado para modificação: Component não muda            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ L - Liskov Substitution Principle                           │
├─────────────────────────────────────────────────────────────┤
│  ✓ WebSocketStrategy pode substituir DataStreamStrategy    │
│  ✓ HttpStrategy pode substituir DataStreamStrategy         │
│  ✓ Comportamento permanece consistente                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ I - Interface Segregation Principle                         │
├─────────────────────────────────────────────────────────────┤
│  ✓ Interface enxuta com apenas métodos necessários         │
│  ✓ Estratégias não são forçadas a implementar métodos      │
│    desnecessários                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ D - Dependency Inversion Principle                          │
├─────────────────────────────────────────────────────────────┤
│  ✓ Component depende de abstração (DataStreamService)      │
│  ✓ Service depende de abstração (DataStreamStrategy)       │
│  ✓ Implementações concretas são injetadas via DI           │
└─────────────────────────────────────────────────────────────┘
```

---

Este guia visual demonstra uma arquitetura **production-ready**, **maintainable** e **extensible**.
