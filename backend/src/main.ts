import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Using PORT from env or defaulting to 3001 to match Railway UI
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Server listening on port ${port}`);
}
bootstrap();
