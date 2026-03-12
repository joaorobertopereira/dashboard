import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ProcessingService } from './processing.service';
import { TaskRequest } from './interfaces/processing.interface';

/**
 * WebSocket Gateway for real-time processing updates
 * Provides the primary communication channel with automatic reconnection support
 */
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/processing',
})
export class ProcessingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProcessingGateway.name);

  constructor(private readonly processingService: ProcessingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection', { status: 'connected', clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Handle task start request from client
   * Subscribes the client to progress updates for the specified task
   */
  @SubscribeMessage('start-task')
  handleStartTask(
    @MessageBody() data: TaskRequest,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Starting task ${data.taskId} for client ${client.id}`);

    // Subscribe to processing updates
    const stream$ = this.processingService.startProcessing(data);

    stream$.subscribe({
      next: (status) => {
        // Emit progress to the specific client
        client.emit('task-progress', status);
        this.logger.debug(`Progress update sent to ${client.id}: ${status.progress}%`);
      },
      complete: () => {
        this.logger.log(`Task ${data.taskId} completed for client ${client.id}`);
      },
      error: (error) => {
        this.logger.error(`Error in task ${data.taskId}:`, error);
        client.emit('task-error', {
          taskId: data.taskId,
          error: error.message,
        });
      },
    });

    // Send acknowledgment
    client.emit('task-started', { taskId: data.taskId, timestamp: Date.now() });
  }

  /**
   * Handle task stop request from client
   */
  @SubscribeMessage('stop-task')
  handleStopTask(
    @MessageBody() data: { taskId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Stopping task ${data.taskId} for client ${client.id}`);
    this.processingService.stopProcessing(data.taskId);
    client.emit('task-stopped', { taskId: data.taskId });
  }

  /**
   * Health check endpoint
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: Date.now() });
  }
}
