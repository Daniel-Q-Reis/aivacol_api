import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './helpers/test-app.factory';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('authenticates with valid credentials and returns JWT token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        nickname: process.env.SEED_USER_NICKNAME ?? 'aivacol',
        password: process.env.SEED_USER_PASSWORD ?? 'Aivacol_Seed_Str0ng!2026',
      });

    expect(response.status).toBe(201);
    expect(typeof response.body.access_token).toBe('string');
  });

  it('rejects invalid credentials with stable code', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      nickname: 'aivacol',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects protected route without token', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/users');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('allows protected route with valid token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        nickname: process.env.SEED_USER_NICKNAME ?? 'aivacol',
        password: process.env.SEED_USER_PASSWORD ?? 'Aivacol_Seed_Str0ng!2026',
      });

    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${login.body.access_token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
