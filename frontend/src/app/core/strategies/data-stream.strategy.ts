import { Observable } from 'rxjs';
import { ProcessingStatus, TaskRequest } from '../models/processing.model';

/**
 * Strategy Pattern Interface
 * Define o contrato que todas as estratégias de comunicação devem implementar
 * 
 * Esta abstração permite que o Dashboard Component consuma dados
 * sem saber qual protocolo (WebSocket ou HTTP) está sendo usado
 */
export abstract class DataStreamStrategy {
  /**
   * Conecta ao backend e retorna um Observable com o status da conexão
   */
  abstract connect(): Observable<boolean>;

  /**
   * Desconecta do backend
   */
  abstract disconnect(): void;

  /**
   * Inicia uma tarefa e retorna um stream de atualizações de progresso
   */
  abstract startTask(request: TaskRequest): Observable<ProcessingStatus>;

  /**
   * Para uma tarefa em execução
   */
  abstract stopTask(taskId: string): void;

  /**
   * Verifica se a estratégia está conectada
   */
  abstract isConnected(): boolean;

  /**
   * Retorna o nome da estratégia (para logging/debugging)
   */
  abstract getStrategyName(): string;
}
