# Testes e Demonstrações

## 🧪 Testando o Sistema

### Cenário 1: WebSocket Funcionando (Caminho Feliz)

1. **Inicie Backend e Frontend**
   ```powershell
   # Terminal 1
   .\start-backend.ps1
   
   # Terminal 2
   .\start-frontend.ps1
   ```

2. **Observe o Console do Browser**
   ```
   [WebSocket Strategy] Connecting to: http://localhost:3000/processing
   [WebSocket Strategy] Connected successfully
   [DataStreamService] WebSocket connected successfully
   ```

3. **Clique em "Iniciar Processamento"**
   - Observe o chip de status: "Conectado: WebSocket"
   - A barra de progresso atualiza em tempo real
   - Console mostra: `[WebSocket Strategy] Progress update: X%`

4. **Verifique a Latência**
   - Updates chegam instantaneamente
   - Sem delay perceptível

---

### Cenário 2: Fallback para HTTP Long Polling

1. **Inicie APENAS o Frontend**
   ```powershell
   .\start-frontend.ps1
   ```

2. **Observe o Fallback Automático**
   ```
   [WebSocket Strategy] Connection error: ...
   [DataStreamService] WebSocket failed, falling back to HTTP Polling
   [HTTP Polling Strategy] Connecting...
   Error: Cannot connect (expected)
   ```

3. **Inicie o Backend**
   ```powershell
   # Em outro terminal
   .\start-backend.ps1
   ```

4. **Recarregue o Frontend**
   - Tente WebSocket novamente
   - Se falhar, HTTP Polling será usado
   - Chip mostrará: "Conectado: HTTP Long Polling"

5. **Clique em "Iniciar Processamento"**
   - Funciona perfeitamente via HTTP!
   - Console mostra: `[HTTP Polling Strategy] Poll update: X%`
   - Latência é maior (2 segundos entre updates)

---

### Cenário 3: Troca Manual de Estratégia

1. **Com tudo funcionando**

2. **Clique no botão "HTTP Polling"**
   ```
   [DataStreamService] Manually switching to http
   [WebSocket Strategy] Disconnecting...
   [HTTP Polling Strategy] Checking connection...
   [HTTP Polling Strategy] Connected successfully
   ```

3. **Inicie uma tarefa**
   - Funciona via HTTP agora

4. **Clique no botão "WebSocket"**
   ```
   [DataStreamService] Manually switching to websocket
   [HTTP Polling Strategy] Disconnecting...
   [WebSocket Strategy] Connecting...
   [WebSocket Strategy] Connected successfully
   ```

5. **Inicie outra tarefa**
   - Volta a funcionar via WebSocket

---

### Cenário 4: Testando Resiliência

1. **Inicie uma tarefa com WebSocket ativo**

2. **Durante o processamento, PARE o backend** (Ctrl+C)

3. **O que acontece:**
   - Frontend detecta desconexão
   - Tenta reconectar automaticamente
   - Se falhar, mantém último estado conhecido

4. **Reinicie o backend**

5. **Inicie nova tarefa**
   - Sistema reconecta automaticamente
   - Pode fazer fallback para HTTP se WebSocket estiver instável

---

## 🔍 Inspecionando Network

### WebSocket

1. Abra DevTools (F12)
2. Vá para a aba **Network**
3. Filtre por **WS** (WebSocket)
4. Observe a conexão persistente
5. Clique na conexão e vá para **Messages**
6. Veja os eventos:
   ```json
   ↑ start-task: {"taskId":"task-123"}
   ↓ task-progress: {"taskId":"task-123","progress":25,...}
   ↓ task-progress: {"taskId":"task-123","progress":50,...}
   ↓ task-progress: {"taskId":"task-123","progress":75,...}
   ```

### HTTP Long Polling

1. Abra DevTools (F12)
2. Vá para a aba **Network**
3. Filtre por **XHR**
4. Observe múltiplas requisições GET para `/poll/:taskId`
5. Cada requisição espera ~2 segundos antes de responder
6. Request/Response contínuos até tarefa completar

---

## 📊 Comparando Estratégias

### WebSocket

| Métrica | Valor |
|---------|-------|
| Latência | ~10ms |
| Overhead de Rede | Baixo (conexão única) |
| Atualizações/seg | Ilimitado |
| Consumo de Banda | Baixo |
| Complexidade | Média |

### HTTP Long Polling

| Métrica | Valor |
|---------|-------|
| Latência | ~2000ms |
| Overhead de Rede | Alto (múltiplas conexões) |
| Atualizações/seg | 0.5 (uma a cada 2s) |
| Consumo de Banda | Médio/Alto |
| Complexidade | Baixa |

---

## 🧪 Testes Unitários (Exemplo)

### Testando o Component

```typescript
// dashboard.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { DataStreamService } from '@core/services/data-stream.service';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let mockService: jasmine.SpyObj<DataStreamService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DataStreamService', [
      'connect',
      'startTask',
      'stopTask',
      'getConnectionStatus'
    ]);

    mockService.getConnectionStatus.and.returnValue(of({
      connected: true,
      strategy: 'WebSocket'
    }));

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DataStreamService, useValue: mockService }
      ]
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start task without knowing protocol', () => {
    // Arrange
    const mockStatus = {
      taskId: 'test-123',
      progress: 50,
      status: 'processing' as const,
      message: 'Testing',
      timestamp: Date.now()
    };
    mockService.startTask.and.returnValue(of(mockStatus));

    // Act
    component.startProcessing();

    // Assert
    expect(mockService.startTask).toHaveBeenCalled();
    expect(component.processingStatus()).toEqual(mockStatus);
  });

  it('should update progress reactively', () => {
    // Arrange
    const status1 = { progress: 25, status: 'processing' as const, taskId: '1', message: '', timestamp: 0 };
    const status2 = { progress: 50, status: 'processing' as const, taskId: '1', message: '', timestamp: 0 };
    
    mockService.startTask.and.returnValue(of(status1, status2));

    // Act
    component.startProcessing();

    // Assert - usando computed signals
    expect(component.progressPercentage()).toBe(50);
  });
});
```

### Testando o Service

```typescript
// data-stream.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { DataStreamService } from './data-stream.service';
import { WebSocketStreamStrategy } from '../strategies/websocket-stream.strategy';
import { HttpPollingStreamStrategy } from '../strategies/http-polling-stream.strategy';
import { of, throwError } from 'rxjs';

describe('DataStreamService', () => {
  let service: DataStreamService;
  let mockWsStrategy: jasmine.SpyObj<WebSocketStreamStrategy>;
  let mockHttpStrategy: jasmine.SpyObj<HttpPollingStreamStrategy>;

  beforeEach(() => {
    mockWsStrategy = jasmine.createSpyObj('WebSocketStreamStrategy', [
      'connect', 'startTask', 'disconnect', 'isConnected', 'getStrategyName'
    ]);
    mockHttpStrategy = jasmine.createSpyObj('HttpPollingStreamStrategy', [
      'connect', 'startTask', 'disconnect', 'isConnected', 'getStrategyName'
    ]);

    TestBed.configureTestingModule({
      providers: [
        DataStreamService,
        { provide: WebSocketStreamStrategy, useValue: mockWsStrategy },
        { provide: HttpPollingStreamStrategy, useValue: mockHttpStrategy }
      ]
    });

    service = TestBed.inject(DataStreamService);
  });

  it('should try WebSocket first', (done) => {
    // Arrange
    mockWsStrategy.connect.and.returnValue(of(true));
    mockWsStrategy.getStrategyName.and.returnValue('WebSocket');

    // Act
    service.connect().subscribe(() => {
      // Assert
      expect(mockWsStrategy.connect).toHaveBeenCalled();
      done();
    });
  });

  it('should fallback to HTTP when WebSocket fails', (done) => {
    // Arrange
    mockWsStrategy.connect.and.returnValue(throwError(() => new Error('Connection failed')));
    mockHttpStrategy.connect.and.returnValue(of(true));
    mockHttpStrategy.getStrategyName.and.returnValue('HTTP Long Polling');

    // Act
    service.connect().subscribe(() => {
      // Assert
      expect(mockWsStrategy.connect).toHaveBeenCalled();
      expect(mockHttpStrategy.connect).toHaveBeenCalled();
      done();
    });
  });

  it('should delegate task to current strategy', () => {
    // Arrange
    const request = { taskId: 'test' };
    const mockStatus = { taskId: 'test', progress: 0, status: 'processing' as const, message: '', timestamp: 0 };
    mockWsStrategy.startTask.and.returnValue(of(mockStatus));

    // Act
    service.startTask(request).subscribe();

    // Assert - não sabemos qual estratégia, mas foi delegado
    // Em um teste real, você controlaria qual estratégia está ativa
  });
});
```

---

## 📝 Checklist de Validação

### ✅ Arquitetura

- [ ] Component não possui if/else para tipo de conexão
- [ ] Component injeta apenas DataStreamService
- [ ] Service gerencia estratégias via DI
- [ ] Estratégias implementam interface comum
- [ ] Fallback é transparente

### ✅ Funcionalidade

- [ ] WebSocket conecta quando disponível
- [ ] HTTP Polling funciona como fallback
- [ ] Progresso atualiza em tempo real
- [ ] Troca de estratégia funciona
- [ ] UI reflete estado corretamente

### ✅ Performance

- [ ] WebSocket tem baixa latência
- [ ] HTTP Polling não sobrecarrega servidor
- [ ] Signals otimizam change detection
- [ ] Sem memory leaks (unsubscribe)

### ✅ Código

- [ ] TypeScript sem erros
- [ ] Código bem documentado
- [ ] Princípios SOLID aplicados
- [ ] Fácil de testar
- [ ] Extensível

---

## 🎓 Lições Aprendidas

1. **Strategy Pattern remove if/else**
   - Componente limpo e focado
   - Cada estratégia isolada

2. **DI do Angular é poderoso**
   - Injection automática
   - Fácil de mockar em testes
   - Promove loose coupling

3. **Abstrações são fundamentais**
   - Interface define contrato
   - Implementações são intercambiáveis
   - Componente depende da abstração

4. **Signals melhoram performance**
   - Change detection otimizada
   - Código mais limpo
   - Reactive por natureza

5. **Fallback transparente é elegante**
   - Usuário não percebe a mudança
   - Sistema resiliente
   - Código mantém-se simples

---

**Este é o padrão correto para sistemas de comunicação em tempo real no Angular!**
