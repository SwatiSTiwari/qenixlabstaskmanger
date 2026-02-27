import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Use Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`WebSocket gateway active on ws://localhost:${port}/tasks`);
}

bootstrap();
