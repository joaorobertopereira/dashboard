import { Injectable } from '@angular/core';
import { Observable, Subject, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { DataStreamStrategy } from './data-stream.strategy';
import { ProcessingStatus, TaskRequest } from '../models/processing.model';

/**
 * WebSocket Strategy Implementation
 * 
 * Implementação concreta usando Socket.IO para comunicação em tempo real
 * Fornece baixa latência e push automático de atualizações
 */
@Injectable({
  providedIn: 'root',
})
export class WebSocketStreamStrategy extends DataStreamStrategy {
  private socket: Socket | null = null;
  private readonly backendUrl = 'http://localhost:3000/processing';
  private connectionSubject = new Subject<boolean>();
  private connected = false;

  connect(): Observable<boolean> {
    if (this.socket?.connected) {
      return new Observable((observer) => {
        observer.next(true);
        observer.complete();
      });
    }

    console.log('[WebSocket Strategy] Connecting to:', this.backendUrl);

    this.socket = io(this.backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Listen to connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket Strategy] Connected successfully');
      this.connected = true;
      this.connectionSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket Strategy] Disconnected');
      this.connected = false;
      this.connectionSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket Strategy] Connection error:', error);
      this.connected = false;
      this.connectionSubject.next(false);
    });

    // Wait for connection confirmation
    return fromEvent(this.socket, 'connection').pipe(
      map(() => {
        this.connected = true;
        return true;
      })
    );
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket Strategy] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  startTask(request: TaskRequest): Observable<ProcessingStatus> {
    if (!this.socket || !this.connected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    console.log('[WebSocket Strategy] Starting task:', request.taskId);

    return new Observable<ProcessingStatus>((observer) => {
      // Listen for progress updates
      this.socket!.on('task-progress', (status: ProcessingStatus) => {
        console.log('[WebSocket Strategy] Progress update:', status.progress);
        observer.next(status);

        // Complete when task is done
        if (status.status === 'completed' || status.status === 'error') {
          observer.complete();
        }
      });

      // Listen for errors
      this.socket!.on('task-error', (error: any) => {
        console.error('[WebSocket Strategy] Task error:', error);
        observer.error(error);
      });

      // Start the task
      this.socket!.emit('start-task', request);

      // Cleanup on unsubscribe
      return () => {
        if (this.socket) {
          this.socket.off('task-progress');
          this.socket.off('task-error');
        }
      };
    });
  }

  stopTask(taskId: string): void {
    if (this.socket && this.connected) {
      console.log('[WebSocket Strategy] Stopping task:', taskId);
      this.socket.emit('stop-task', { taskId });
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  getStrategyName(): string {
    return 'WebSocket';
  }
}
