export interface ProcessingStatus {
  taskId: string;
  progress: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  message: string;
  timestamp: number;
}

export interface TaskRequest {
  taskId: string;
  data?: any;
}
