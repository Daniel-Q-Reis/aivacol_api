import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './helpers/test-app.factory';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.THROTTLE_TTL_SECONDS = '2';
    process.env.THROTTLE_LIMIT = '2';
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns deterministic 429 payload with RATE_LIMIT_EXCEEDED code', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      nickname: 'aivacol',
      password: 'wrong-password',
    });
    await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      nickname: 'aivacol',
      password: 'wrong-password',
    });

    // Controlled low limit and tight window keep this scenario deterministic and non-flaky.
    const throttled = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      nickname: 'aivacol',
      password: 'wrong-password',
    });

    expect(throttled.status).toBe(429);
    expect(throttled.body).toEqual(
      expect.objectContaining({
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: expect.any(String),
        timestamp: expect.any(String),
        path: '/api/v1/auth/login',
      }),
    );
  });
});
