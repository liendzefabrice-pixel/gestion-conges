import { ValidationPipe, BadRequestException } from '@nestjs/common';
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
      disableErrorMessages: false,
    }),
  );

  // Sécurité : Helmet (en-têtes HTTP)
  app.use(helmet());

  // Autoriser les requêtes du frontend
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [process.env.FRONTEND_URL || 'http://localhost:5173'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Servir les fichiers statiques (logo pour les emails)
  app.useStaticAssets(path.join(process.cwd(), 'public'), {
    prefix: '/',
  });

  const port = process.env.PORT || 3000;
  const server = await app.listen(port);

  // Timeout serveur (évite les requêtes pendantes)
  const serverTimeout = parseInt(process.env.SERVER_TIMEOUT || '120000', 10);
  server.setTimeout(serverTimeout);

  console.log(`🚀 Backend lancé sur http://localhost:${port}/api/v1`);
}

bootstrap();