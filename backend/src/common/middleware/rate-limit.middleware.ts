import type { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '@nestjs/common';

type WindowEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100);

const store = new Map<string, WindowEntry>();

function getClientIp(request: Request): string {
  return (request.ip ??
    request.socket.remoteAddress ??
    'unknown') as string;
}

function getEntry(key: string): WindowEntry {
  const entry = store.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetAt) {
    const newEntry: WindowEntry = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
    store.set(key, newEntry);
    return newEntry;
  }

  return entry;
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

setInterval(cleanup, Math.min(RATE_LIMIT_WINDOW_MS * 2, 5 * 60 * 1000));

export function rateLimitMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const clientIp = getClientIp(request);
  const entry = getEntry(clientIp);

  entry.count += 1;

  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);
  const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000);

  response.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
  response.setHeader('X-RateLimit-Remaining', String(remaining));
  response.setHeader('X-RateLimit-Reset', String(entry.resetAt));

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    response.setHeader('Retry-After', String(retryAfter));
    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Too many requests. Please try again later.',
      retryAfter,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: (request as Request & { requestId?: string }).requestId,
    });
    return;
  }

  next();
}
