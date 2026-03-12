import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { DataStreamService } from '@core/services/data-stream.service';
import { ProcessingStatus } from '@core/models/processing.model';

/**
 * Dashboard Component - Smart Component
 * 
 * TRANSPARÊNCIA TOTAL: Este componente NÃO sabe se está usando WebSocket ou HTTP
 * Ele consome o DataStreamService que abstrai completamente o protocolo de comunicação
 * 
 * ZERO if/else para verificar tipo de conexão
 * ZERO dependência de protocolo específico
 * 
 * Este é o design correto usando Strategy Pattern + DI do Angular
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Injeção do serviço via inject() (API moderna do Angular)
  private readonly dataStreamService = inject(DataStreamService);
  private readonly destroy$ = new Subject<void>();

  // State usando Signals (Angular 17+)
  readonly connectionStatus = signal<{ connected: boolean; strategy: string }>({
    connected: false,
    strategy: 'none',
  });

  readonly processingStatus = signal<ProcessingStatus | null>(null);
  readonly isProcessing = computed(() => this.processingStatus()?.status === 'processing');
  readonly taskId = signal<string>('task-' + Date.now());

  // Computed signals para UI
  readonly progressPercentage = computed(() => this.processingStatus()?.progress ?? 0);
  readonly statusMessage = computed(() => this.processingStatus()?.message ?? 'Aguardando...');
  readonly isCompleted = computed(() => this.processingStatus()?.status === 'completed');
  readonly hasError = computed(() => this.processingStatus()?.status === 'error');

  ngOnInit(): void {
    this.initializeConnection();
    this.subscribeToConnectionStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dataStreamService.disconnect();
  }

  /**
   * Inicializa conexão com o backend
   * NÃO sabemos se será WebSocket ou HTTP - é transparente!
   */
  private initializeConnection(): void {
    this.dataStreamService
      .connect()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (connected) => {
          console.log('[Dashboard] Connection established:', connected);
        },
        error: (error) => {
          console.error('[Dashboard] Connection failed:', error);
        },
      });
  }

  /**
   * Monitora status da conexão (para exibir na UI)
   */
  private subscribeToConnectionStatus(): void {
    this.dataStreamService
      .getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.connectionStatus.set(status);
      });
  }

  /**
   * Inicia processamento de uma tarefa
   * TRANSPARÊNCIA: Não sabemos qual protocolo está sendo usado!
   */
  startProcessing(): void {
    const newTaskId = 'task-' + Date.now();
    this.taskId.set(newTaskId);
    this.processingStatus.set(null);

    console.log('[Dashboard] Starting task:', newTaskId);

    this.dataStreamService
      .startTask({ taskId: newTaskId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          console.log('[Dashboard] Progress update:', status);
          this.processingStatus.set(status);
        },
        complete: () => {
          console.log('[Dashboard] Task completed');
        },
        error: (error) => {
          console.error('[Dashboard] Task error:', error);
          this.processingStatus.set({
            taskId: newTaskId,
            progress: 0,
            status: 'error',
            message: 'Erro ao processar tarefa',
            timestamp: Date.now(),
          });
        },
      });
  }

  /**
   * Para o processamento atual
   */
  stopProcessing(): void {
    const currentTaskId = this.taskId();
    if (currentTaskId) {
      console.log('[Dashboard] Stopping task:', currentTaskId);
      this.dataStreamService.stopTask(currentTaskId);
    }
  }

  /**
   * Reinicia o processo
   */
  resetTask(): void {
    this.processingStatus.set(null);
  }

  /**
   * Força troca de estratégia (apenas para demonstração)
   * Em produção, isso seria automático baseado em falhas de conexão
   */
  switchToWebSocket(): void {
    this.dataStreamService.switchStrategy('websocket').subscribe();
  }

  switchToHttp(): void {
    this.dataStreamService.switchStrategy('http').subscribe();
  }

  /**
   * Obtém a cor do chip de status
   */
  getStatusColor(): 'primary' | 'accent' | 'warn' {
    if (!this.connectionStatus().connected) return 'warn';
    if (this.connectionStatus().strategy === 'WebSocket') return 'primary';
    return 'accent';
  }

  /**
   * Obtém o ícone de conexão
   */
  getConnectionIcon(): string {
    if (!this.connectionStatus().connected) return 'cloud_off';
    if (this.connectionStatus().strategy === 'WebSocket') return 'wifi';
    return 'http';
  }
}
