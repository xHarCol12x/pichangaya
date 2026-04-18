import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Explicitly parse port as integer and use 0.0.0.0 for public access
  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');
  
  const url = await app.getUrl();
  // Using console.log to be super clear in Railway logs
  console.log(`[STABILITY-LOG] Server is up on: ${url}`);
  console.log(`[STABILITY-LOG] Binding to host: 0.0.0.0, port: ${port}`);
}
bootstrap();
