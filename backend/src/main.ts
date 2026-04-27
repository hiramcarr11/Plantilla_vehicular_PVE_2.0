import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { httpLoggingMiddleware, rateLimitMiddleware, requestIdMiddleware } from './common/middleware';

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-XSS-Protection': '0',
  'Cache-Control': 'no-store',
};

function isLocalDevelopmentOrigin(origin: string) {
  try {
    const parsedOrigin = new URL(origin);
    const hostname = parsedOrigin.hostname;
    const port = Number(parsedOrigin.port);
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isPrivateIpv4 =
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    const isVitePort = port >= 5173 && port <= 5179;
    return parsedOrigin.protocol === 'http:' && isVitePort && (isLocalhost || isPrivateIpv4);
  } catch {
    return false;
  }
}

function buildCorsOriginChecker() {
  const configuredOrigins = (process.env.FRONTEND_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.has(origin) || isLocalDevelopmentOrigin(origin)) {
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
  const vehiclePhotosDir = join(process.cwd(), 'uploads', 'vehicle-photos');
  const messagePhotosDir = join(process.cwd(), 'uploads', 'message-photos');

  if (!existsSync(vehiclePhotosDir)) {
    mkdirSync(vehiclePhotosDir, { recursive: true });
  }

  if (!existsSync(messagePhotosDir)) {
    mkdirSync(messagePhotosDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', resolveTrustProxy());

  const uploadsDir = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads',
    setHeaders: (res: Response) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  });

  app.use(requestIdMiddleware);
  app.use(rateLimitMiddleware);
  app.use(httpLoggingMiddleware);

  app.enableCors({
    origin: buildCorsOriginChecker(),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.use((request: Request, response: Response, next: NextFunction) => {
    const isUpload = request.path.startsWith('/uploads');

    Object.entries(SECURITY_HEADERS).forEach(([headerName, headerValue]) => {
      if (isUpload && headerName === 'Cross-Origin-Resource-Policy') {
        response.setHeader(headerName, 'cross-origin');
      } else if (isUpload && headerName === 'Cache-Control') {
        response.setHeader(headerName, 'public, max-age=86400');
      } else {
        response.setHeader(headerName, headerValue);
      }
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
  console.log("servidor listo");
  
}

bootstrap();
