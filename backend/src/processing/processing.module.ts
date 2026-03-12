import { Module } from '@nestjs/common';
import { ProcessingService } from './processing.service';
import { ProcessingGateway } from './processing.gateway';
import { ProcessingController } from './processing.controller';

@Module({
  providers: [ProcessingService, ProcessingGateway],
  controllers: [ProcessingController],
  exports: [ProcessingService],
})
export class ProcessingModule {}
