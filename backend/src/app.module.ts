import { Module } from '@nestjs/common';
import { ProcessingModule } from './processing/processing.module';

@Module({
  imports: [ProcessingModule],
})
export class AppModule {}
