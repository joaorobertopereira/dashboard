import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Logger,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ProcessingService } from './processing.service';
import { TaskRequest, ProcessingStatus } from './interfaces/processing.interface';
import { take, timeout } from 'rxjs/operators';

/**
 * HTTP Controller for Long Polling fallback
 * Used when WebSocket connection is unavailable
 * Implements long-polling pattern for real-time-like updates via HTTP
 */
@Controller('processing')
export class ProcessingController {
  private readonly logger = new Logger(ProcessingController.name);
  private readonly LONG_POLL_TIMEOUT = 30000; // 30 seconds

  constructor(private readonly processingService: ProcessingService) {}

  /**
   * Start a new processing task
   * POST /processing/start
   */
  @Post('start')
  async startTask(@Body() request: TaskRequest): Promise<{ taskId: string; message: string }> {
    this.logger.log(`HTTP: Starting task ${request.taskId}`);

    // Initialize the processing (but don't subscribe here)
    this.processingService.startProcessing(request);

    return {
      taskId: request.taskId,
      message: 'Task started. Use /processing/poll/:taskId to get updates',
    };
  }

  /**
   * Long polling endpoint for task updates
   * GET /processing/poll/:taskId
   * 
   * This endpoint will wait up to 30 seconds for a new update
   * If no update arrives, it returns the last known status
   */
  @Get('poll/:taskId')
  async pollTask(
    @Param('taskId') taskId: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(`HTTP Long Poll: Client polling for task ${taskId}`);

    const stream$ = this.processingService.getTaskStream(taskId);

    if (!stream$) {
      res.status(HttpStatus.NOT_FOUND).json({
        error: 'Task not found',
        taskId,
      });
      return;
    }

    try {
      // Wait for next update with timeout
      const status = await stream$
        .pipe(
          take(1), // Take only one emission
          timeout(this.LONG_POLL_TIMEOUT), // Timeout after 30s
        )
        .toPromise();

      res.status(HttpStatus.OK).json(status);
    } catch (error) {
      // Timeout or error - return last known status
      this.logger.debug(`Long poll timeout for task ${taskId}`);
      
      const lastStatus: ProcessingStatus = {
        taskId,
        progress: 0,
        status: 'processing',
        message: 'Waiting for updates...',
        timestamp: Date.now(),
      };

      res.status(HttpStatus.OK).json(lastStatus);
    }
  }

  /**
   * Stop a processing task
   * POST /processing/stop/:taskId
   */
  @Post('stop/:taskId')
  async stopTask(@Param('taskId') taskId: string): Promise<{ message: string }> {
    this.logger.log(`HTTP: Stopping task ${taskId}`);
    this.processingService.stopProcessing(taskId);

    return {
      message: `Task ${taskId} stopped`,
    };
  }

  /**
   * Health check endpoint
   * GET /processing/health
   */
  @Get('health')
  health(): { status: string; timestamp: number } {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }
}
