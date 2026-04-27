import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const requestId = request.header(REQUEST_ID_HEADER) ?? randomUUID();
  response.setHeader(REQUEST_ID_HEADER, requestId);
  (request as Request & { requestId: string }).requestId = requestId;
  next();
}
