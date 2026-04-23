import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

function buildCorsOriginChecker() {
  const configuredOrigins = (process.env.FRONTEND_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin ${origin}`));
  };
}

function resolveTrustProxy() {
  const trustProxy = process.env.TRUST_PROXY?.trim();

  if (!trustProxy) {
    return false;
  }

  if (trustProxy === 'true') {
    return true;
  }

  if (trustProxy === 'false') {
    return false;
  }

  const parsedNumber = Number(trustProxy);
  return Number.isNaN(parsedNumber) ? trustProxy : parsedNumber;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', resolveTrustProxy());

  app.enableCors({
    origin: buildCorsOriginChecker(),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.use((request: Request, response: Response, next: NextFunction) => {
    Object.entries(SECURITY_HEADERS).forEach(([headerName, headerValue]) => {
      response.setHeader(headerName, headerValue);
    });

    if (request.secure || request.headers['x-forwarded-proto'] === 'https') {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
}

bootstrap();
