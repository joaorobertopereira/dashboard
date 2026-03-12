import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, interval, EMPTY } from 'rxjs';
import { switchMap, takeWhile, catchError, tap } from 'rxjs/operators';
import { DataStreamStrategy } from './data-stream.strategy';
import { ProcessingStatus, TaskRequest } from '../models/processing.model';

/**
 * HTTP Long Polling Strategy Implementation
 * 
 * Implementação de fallback usando Long Polling via HTTP
 * Simula comportamento em tempo real através de requisições recursivas
 * com timeout para aguardar novas atualizações no servidor
 */
@Injectable({
  providedIn: 'root',
})
export class HttpPollingStreamStrategy extends DataStreamStrategy {
  private readonly backendUrl = 'http://localhost:3000/processing';
  private connected = false;
  private pollingInterval = 2000; // Poll every 2 seconds
  private activePolling = new Map<string, Subject<ProcessingStatus>>();

  constructor(private http: HttpClient) {
    super();
  }

  connect(): Observable<boolean> {
    console.log('[HTTP Polling Strategy] Checking connection...');

    return this.http.get<{ status: string }>(`${this.backendUrl}/health`).pipe(
      tap(() => {
        console.log('[HTTP Polling Strategy] Connected successfully');
        this.connected = true;
      }),
      switchMap(() => {
        return new Observable<boolean>((observer) => {
          observer.next(true);
          observer.complete();
        });
      }),
      catchError((error) => {
        console.error('[HTTP Polling Strategy] Connection failed:', error);
        this.connected = false;
        return new Observable<boolean>((observer) => {
          observer.next(false);
          observer.complete();
        });
      })
    );
  }

  disconnect(): void {
    console.log('[HTTP Polling Strategy] Disconnecting...');
    this.connected = false;

    // Stop all active polling
    this.activePolling.forEach((subject, taskId) => {
      subject.complete();
    });
    this.activePolling.clear();
  }

  startTask(request: TaskRequest): Observable<ProcessingStatus> {
    if (!this.connected) {
      throw new Error('HTTP Polling not connected. Call connect() first.');
    }

    console.log('[HTTP Polling Strategy] Starting task:', request.taskId);

    // Create a subject for this task
    const subject = new Subject<ProcessingStatus>();
    this.activePolling.set(request.taskId, subject);

    // Start the task on the server
    this.http.post(`${this.backendUrl}/start`, request).subscribe({
      next: () => {
        console.log('[HTTP Polling Strategy] Task started on server');
        this.startPolling(request.taskId, subject);
      },
      error: (error) => {
        console.error('[HTTP Polling Strategy] Failed to start task:', error);
        subject.error(error);
      },
    });

    return subject.asObservable();
  }

  stopTask(taskId: string): void {
    console.log('[HTTP Polling Strategy] Stopping task:', taskId);

    // Stop polling
    const subject = this.activePolling.get(taskId);
    if (subject) {
      subject.complete();
      this.activePolling.delete(taskId);
    }

    // Notify server
    this.http.post(`${this.backendUrl}/stop/${taskId}`, {}).subscribe();
  }

  isConnected(): boolean {
    return this.connected;
  }

  getStrategyName(): string {
    return 'HTTP Long Polling';
  }

  /**
   * Implementa o padrão Long Polling
   * Faz requisições recursivas ao servidor aguardando por atualizações
   */
  private startPolling(taskId: string, subject: Subject<ProcessingStatus>): void {
    const poll$ = interval(this.pollingInterval).pipe(
      switchMap(() => {
        return this.http.get<ProcessingStatus>(`${this.backendUrl}/poll/${taskId}`).pipe(
          catchError((error) => {
            console.error('[HTTP Polling Strategy] Poll error:', error);
            return EMPTY;
          })
        );
      }),
      takeWhile(
        (status) => {
          // Continue polling until task is completed or error
          return status.status !== 'completed' && status.status !== 'error';
        },
        true // Include the final emission
      )
    );

    poll$.subscribe({
      next: (status) => {
        console.log('[HTTP Polling Strategy] Poll update:', status.progress);
        subject.next(status);

        // Complete if task is done
        if (status.status === 'completed' || status.status === 'error') {
          subject.complete();
          this.activePolling.delete(taskId);
        }
      },
      error: (error) => {
        console.error('[HTTP Polling Strategy] Polling failed:', error);
        subject.error(error);
        this.activePolling.delete(taskId);
      },
      complete: () => {
        console.log('[HTTP Polling Strategy] Polling completed for:', taskId);
      },
    });
  }
}
