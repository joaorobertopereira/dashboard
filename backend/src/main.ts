import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: 'http://localhost:4200',
      credentials: true,
    },
  });

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('🔌 WebSocket available on ws://localhost:3000');
}

bootstrap();
