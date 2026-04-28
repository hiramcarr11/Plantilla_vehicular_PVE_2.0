import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

function extractMessage(responseBody: unknown, fallback: string): string {
  if (typeof responseBody === 'string') {
    return responseBody;
  }

  if (typeof responseBody === 'object' && responseBody !== null) {
    const body = responseBody as Record<string, unknown>;
    const message = body.message;

    if (Array.isArray(message) && message.length > 0) {
      return message[0] as string;
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      message = extractMessage(responseBody, exception.message);

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `HTTP ${status} ${request?.method} ${request?.url} - ${message}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      }
    } else if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as Record<string, unknown> | undefined;
      const code = driverError?.['code'] as string | undefined;

      if (code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Ya existe un registro con la misma restriccion unica.';
        this.logger.warn(
          `Unique constraint violation ${request?.method} ${request?.url} - code ${code}`,
        );
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Error interno del servidor';
        this.logger.error(
          `Database query failed ${request?.method} ${request?.url}: ${exception.message}`,
          exception.stack,
        );
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error interno del servidor';
      this.logger.error(
        `Unhandled exception ${request?.method} ${request?.url}: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request?.url,
      requestId: request?.requestId,
    };

    response.status(status).json(errorResponse);
  }
}
