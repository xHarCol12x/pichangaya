import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable cookie parsing for secure refresh tokens
  app.use(cookieParser());

  // Configure strict global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Secure CORS configuration
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000'],
    credentials: true,
  });
  
  // Explicitly parse port as integer and use 0.0.0.0 for public access
  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');
  
  const url = await app.getUrl();
  // Using console.log to be super clear in Railway logs
  console.log(`[STABILITY-LOG] Server is up on: ${url}`);
  console.log(`[STABILITY-LOG] Binding to host: 0.0.0.0, port: ${port}`);
}
bootstrap();
