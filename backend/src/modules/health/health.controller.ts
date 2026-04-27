import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check(@Res() response: Response) {
    const dbStatus = await this.checkDatabase();
    const httpStatus = dbStatus === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return response.status(httpStatus).json({
      status: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    });
  }

  @Get('ready')
  async ready(@Res() response: Response) {
    const dbStatus = await this.checkDatabase();
    const httpStatus = dbStatus === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return response.status(httpStatus).json({
      status: dbStatus === 'ok' ? 'ready' : 'not_ready',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  }

  @Get('metrics')
  async metrics() {
    const dbStatus = await this.checkDatabase();
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);

    return {
      process: {
        uptimeSeconds,
        uptimeHuman: `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      },
      database: {
        status: dbStatus,
      },
    };
  }

  private async checkDatabase(): Promise<'ok' | 'error'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
