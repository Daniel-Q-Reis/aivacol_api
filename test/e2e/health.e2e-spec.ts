import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './helpers/test-app.factory';
import { loginAndGetToken } from './helpers/auth.helper';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    token = await loginAndGetToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without token', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('returns connector status with authenticated request', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(['ok', 'degraded']).toContain(response.body.status);
    expect(response.body.connectors).toEqual(
      expect.objectContaining({
        sqlServer: expect.any(Object),
        redis: expect.any(Object),
        rabbitMq: expect.any(Object),
        mongoDb: expect.any(Object),
      }),
    );
  });
});
