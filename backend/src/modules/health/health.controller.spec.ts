import { HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';

function createMockDataSource(healthy: boolean) {
  return {
    query: jest.fn().mockImplementation(async () => {
      if (!healthy) {
        throw new Error('Database connection failed');
      }
      return [{ '?column?': 1 }];
    }),
  };
}

function createMockResponse() {
  const state: { statusCode: number; body: unknown } = {
    statusCode: HttpStatus.OK,
    body: null,
  };

  const mockRes = {
    status: jest.fn().mockImplementation((code: number) => {
      state.statusCode = code;
      return mockRes;
    }),
    json: jest.fn().mockImplementation((data: unknown) => {
      state.body = data;
      return mockRes;
    }),
    getStatusCode: () => state.statusCode,
    getBody: () => state.body,
  };

  return mockRes;
}

describe('HealthController', () => {
  it('returns status ok when database is healthy', async () => {
    const dataSource = createMockDataSource(true);
    const controller = new HealthController(dataSource as never);
    const mockRes = createMockResponse();

    await controller.check(mockRes as never);

    expect(mockRes.getStatusCode()).toBe(HttpStatus.OK);
    const body = mockRes.getBody() as Record<string, unknown>;
    expect(body.status).toBe('ok');
    expect(body.database).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe('string');
    expect(body.uptime).toBeDefined();
    expect(typeof body.uptime).toBe('number');
    expect((body.uptime as number)).toBeGreaterThan(0);
  });

  it('returns status error when database is unavailable', async () => {
    const dataSource = createMockDataSource(false);
    const controller = new HealthController(dataSource as never);
    const mockRes = createMockResponse();

    await controller.check(mockRes as never);

    expect(mockRes.getStatusCode()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    const body = mockRes.getBody() as Record<string, unknown>;
    expect(body.status).toBe('error');
    expect(body.database).toBe('error');
  });

  it('returns a valid ISO timestamp', async () => {
    const dataSource = createMockDataSource(true);
    const controller = new HealthController(dataSource as never);
    const mockRes = createMockResponse();

    await controller.check(mockRes as never);

    const body = mockRes.getBody() as Record<string, unknown>;
    const parsed = new Date(body.timestamp as string);

    expect(isNaN(parsed.getTime())).toBe(false);
  });
});
