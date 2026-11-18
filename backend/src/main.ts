process.env.TZ = process.env.TZ ?? 'America/Bogota';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Las evidencias, documentos e imágenes de categorías llegan como data URLs
  // dentro del JSON, así que el límite por defecto (100 kB) no alcanza.
  app.useBodyParser('json', { limit: '25mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Frontend en Next.js (puerto 3001 en desarrollo). FRONTEND_URL admite varios
  // orígenes separados por coma, por ejemplo el local y el de producción.
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
