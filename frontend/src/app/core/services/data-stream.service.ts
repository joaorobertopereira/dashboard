import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { DataStreamStrategy } from '../strategies/data-stream.strategy';
import { WebSocketStreamStrategy } from '../strategies/websocket-stream.strategy';
import { HttpPollingStreamStrategy } from '../strategies/http-polling-stream.strategy';
import { ProcessingStatus, TaskRequest } from '../models/processing.model';

/**
 * Service de gerenciamento de estratégias de comunicação
 * 
 * Este serviço implementa o padrão Strategy e usa o sistema de DI do Angular
 * para fornecer transparência total ao componente consumidor.
 * 
 * RESPONSABILIDADES:
 * - Gerenciar qual estratégia está ativa (WebSocket ou HTTP)
 * - Implementar fallback automático e transparente
 * - Expor interface unificada independente do protocolo usado
 * 
 * O Dashboard Component NÃO sabe qual estratégia está ativa.
 */
@Injectable({
  providedIn: 'root',
})
export class DataStreamService {
  // Injeção de dependência das estratégias
  private readonly wsStrategy = inject(WebSocketStreamStrategy);
  private readonly httpStrategy = inject(HttpPollingStreamStrategy);

  // Estratégia atualmente ativa
  private currentStrategy: DataStreamStrategy;

  // Estado da conexão (para UI)
  private connectionStatus$ = new BehaviorSubject<{
    connected: boolean;
    strategy: string;
  }>({
    connected: false,
    strategy: 'none',
  });

  constructor() {
    // Inicia com WebSocket como estratégia preferencial
    this.currentStrategy = this.wsStrategy;
  }

  /**
   * Observable para o Dashboard monitorar o status da conexão
   * (Útil para exibir indicadores visuais)
   */
  getConnectionStatus(): Observable<{ connected: boolean; strategy: string }> {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Conecta usando a melhor estratégia disponível
   * Tenta WebSocket primeiro, faz fallback para HTTP se falhar
   * 
   * TRANSPARÊNCIA: O componente chama connect() sem saber qual protocolo será usado
   */
  connect(): Observable<boolean> {
    console.log('[DataStreamService] Initiating connection...');

    return this.tryWebSocket().pipe(
      catchError(() => {
        console.log('[DataStreamService] WebSocket failed, falling back to HTTP Polling');
        return this.fallbackToHttp();
      })
    );
  }

  /**
   * Inicia uma tarefa de processamento
   * 
   * TRANSPARÊNCIA TOTAL: O componente não sabe qual estratégia está executando
   * Pode ser WebSocket ou HTTP - o comportamento é idêntico
   */
  startTask(request: TaskRequest): Observable<ProcessingStatus> {
    console.log(
      `[DataStreamService] Starting task using ${this.currentStrategy.getStrategyName()}`
    );

    return this.currentStrategy.startTask(request).pipe(
      catchError((error) => {
        console.error('[DataStreamService] Task failed with current strategy:', error);

        // Se WebSocket falhar, tenta fallback para HTTP
        if (this.currentStrategy instanceof WebSocketStreamStrategy) {
          console.log('[DataStreamService] Attempting fallback to HTTP...');
          return this.fallbackToHttp().pipe(
            switchMap(() => this.currentStrategy.startTask(request))
          );
        }

        throw error;
      })
    );
  }

  /**
   * Para uma tarefa em execução
   */
  stopTask(taskId: string): void {
    this.currentStrategy.stopTask(taskId);
  }

  /**
   * Desconecta a estratégia atual
   */
  disconnect(): void {
    console.log('[DataStreamService] Disconnecting...');
    this.currentStrategy.disconnect();
    this.connectionStatus$.next({ connected: false, strategy: 'none' });
  }

  /**
   * Força a troca de estratégia (útil para testes ou preferências do usuário)
   */
  switchStrategy(strategyType: 'websocket' | 'http'): Observable<boolean> {
    console.log(`[DataStreamService] Manually switching to ${strategyType}`);

    // Desconecta estratégia atual
    this.currentStrategy.disconnect();

    // Seleciona nova estratégia
    this.currentStrategy =
      strategyType === 'websocket' ? this.wsStrategy : this.httpStrategy;

    // Conecta com a nova estratégia
    return this.currentStrategy.connect().pipe(
      tap((connected) => {
        this.connectionStatus$.next({
          connected,
          strategy: this.currentStrategy.getStrategyName(),
        });
      })
    );
  }

  /**
   * Retorna informações sobre a estratégia atual (para debugging/logs)
   */
  getCurrentStrategyInfo(): { name: string; connected: boolean } {
    return {
      name: this.currentStrategy.getStrategyName(),
      connected: this.currentStrategy.isConnected(),
    };
  }

  /**
   * PRIVADO: Tenta conectar via WebSocket
   */
  private tryWebSocket(): Observable<boolean> {
    console.log('[DataStreamService] Trying WebSocket connection...');
    this.currentStrategy = this.wsStrategy;

    return this.wsStrategy.connect().pipe(
      tap((connected) => {
        if (connected) {
          console.log('[DataStreamService] WebSocket connected successfully');
          this.connectionStatus$.next({
            connected: true,
            strategy: 'WebSocket',
          });
        }
      })
    );
  }

  /**
   * PRIVADO: Faz fallback para HTTP Long Polling
   */
  private fallbackToHttp(): Observable<boolean> {
    console.log('[DataStreamService] Switching to HTTP Long Polling...');
    this.currentStrategy = this.httpStrategy;

    return this.httpStrategy.connect().pipe(
      tap((connected) => {
        if (connected) {
          console.log('[DataStreamService] HTTP Polling connected successfully');
          this.connectionStatus$.next({
            connected: true,
            strategy: 'HTTP Long Polling',
          });
        } else {
          throw new Error('Failed to connect with HTTP Polling');
        }
      })
    );
  }
}
