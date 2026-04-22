import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function buildCorsOriginChecker() {
  const configuredOrigins = (process.env.FRONTEND_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);
  const privateNetworkOriginPattern =
    /^https?:\/\/(?:localhost|127\.0\.0\.1|192\.168(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?::\d+)?$/u;

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.has(origin) || privateNetworkOriginPattern.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin ${origin}`));
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: buildCorsOriginChecker(),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

bootstrap();
