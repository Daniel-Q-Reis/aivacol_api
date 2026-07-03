import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export async function loginAndGetToken(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      nickname: process.env.SEED_USER_NICKNAME ?? 'aivacol',
      password: process.env.SEED_USER_PASSWORD ?? 'Aivacol_Seed_Str0ng!2026',
    });

  if (response.status !== 201 || !response.body?.access_token) {
    throw new Error(`Failed to authenticate test user. status=${response.status}`);
  }

  return response.body.access_token as string;
}
