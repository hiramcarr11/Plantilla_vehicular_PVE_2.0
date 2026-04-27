import { Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

const logger = new Logger('HTTP');

export function httpLoggingMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const start = Date.now();
  const requestId = (request as Request & { requestId?: string }).requestId;

  response.on('finish', () => {
    const durationMs = Date.now() - start;
    const method = request.method;
    const url = request.originalUrl;
    const statusCode = response.statusCode;

    logger.log(
      `${method} ${url} ${statusCode} ${durationMs}ms${requestId ? ` reqId=${requestId}` : ''}`,
    );
  });

  next();
}
