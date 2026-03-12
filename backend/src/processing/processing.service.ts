import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { ProcessingStatus, TaskRequest } from './interfaces/processing.interface';

/**
 * Service responsible for managing processing tasks
 * This simulates a real processing workflow that emits progress updates
 */
@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);
  private readonly statusUpdates = new Map<string, Subject<ProcessingStatus>>();
  private readonly activeProcesses = new Map<string, NodeJS.Timeout>();

  /**
   * Start a new processing task
   * Creates a stream of progress updates that can be consumed via WebSocket or HTTP
   */
  startProcessing(request: TaskRequest): Observable<ProcessingStatus> {
    const { taskId } = request;

    // Clean up existing process if any
    this.stopProcessing(taskId);

    // Create new subject for this task
    const subject = new Subject<ProcessingStatus>();
    this.statusUpdates.set(taskId, subject);

    this.logger.log(`Starting processing for task: ${taskId}`);

    // Simulate processing with progress updates
    this.simulateProcessing(taskId, subject);

    return subject.asObservable();
  }

  /**
   * Get the current status observable for a task
   */
  getTaskStream(taskId: string): Observable<ProcessingStatus> | null {
    const subject = this.statusUpdates.get(taskId);
    return subject ? subject.asObservable() : null;
  }

  /**
   * Stop processing for a specific task
   */
  stopProcessing(taskId: string): void {
    const interval = this.activeProcesses.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.activeProcesses.delete(taskId);
    }

    const subject = this.statusUpdates.get(taskId);
    if (subject) {
      subject.complete();
      this.statusUpdates.delete(taskId);
    }

    this.logger.log(`Stopped processing for task: ${taskId}`);
  }

  /**
   * Get latest status for a task (for long polling)
   */
  getLatestStatus(taskId: string): ProcessingStatus | null {
    const subject = this.statusUpdates.get(taskId);
    if (!subject) {
      return null;
    }

    // Return a snapshot - in real world, you'd store the latest state
    return {
      taskId,
      progress: 0,
      status: 'processing',
      message: 'Task in progress',
      timestamp: Date.now(),
    };
  }

  /**
   * Simulate a processing task with incremental progress
   */
  private simulateProcessing(taskId: string, subject: Subject<ProcessingStatus>): void {
    let progress = 0;
    const steps = [
      'Initializing task',
      'Loading data',
      'Processing batch 1/5',
      'Processing batch 2/5',
      'Processing batch 3/5',
      'Processing batch 4/5',
      'Processing batch 5/5',
      'Finalizing results',
      'Completed successfully',
    ];

    // Emit initial status
    subject.next({
      taskId,
      progress: 0,
      status: 'processing',
      message: steps[0],
      timestamp: Date.now(),
    });

    const interval = setInterval(() => {
      progress += Math.random() * 15; // Random progress increment

      if (progress >= 100) {
        progress = 100;
        subject.next({
          taskId,
          progress: 100,
          status: 'completed',
          message: steps[steps.length - 1],
          timestamp: Date.now(),
        });

        this.stopProcessing(taskId);
        return;
      }

      const stepIndex = Math.floor((progress / 100) * (steps.length - 1));

      subject.next({
        taskId,
        progress: Math.floor(progress),
        status: 'processing',
        message: steps[stepIndex],
        timestamp: Date.now(),
      });
    }, 1000); // Update every second

    this.activeProcesses.set(taskId, interval);
  }
}
