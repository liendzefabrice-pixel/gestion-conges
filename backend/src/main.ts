import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as path from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Préfixe global des routes
  app.setGlobalPrefix('api/v1');

  // Validation automatique
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Sécurité : Helmet (en-têtes HTTP)
  app.use(helmet());

  // Autoriser les requêtes du frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Servir les fichiers statiques (logo pour les emails)
  app.useStaticAssets(path.join(process.cwd(), 'public'), {
    prefix: '/',
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 Backend lancé sur http://localhost:${port}/api/v1`);
}

bootstrap();