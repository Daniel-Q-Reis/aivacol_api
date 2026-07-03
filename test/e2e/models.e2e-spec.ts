import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createTestApp } from './helpers/test-app.factory';
import { loginAndGetToken } from './helpers/auth.helper';

describe('Models (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let brandId: string;

  beforeAll(async () => {
    app = await createTestApp();
    token = await loginAndGetToken(app);

    const brand = await request(app.getHttpServer())
      .post('/api/v1/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `QA Model Brand ${Date.now()}` });

    brandId = brand.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('performs CRUD and validates 400/404/409 contracts', async () => {
    const name = `QA Model ${Date.now()}`;

    const create = await request(app.getHttpServer())
      .post('/api/v1/models')
      .set('Authorization', `Bearer ${token}`)
      .send({ name, brandId });
    expect(create.status).toBe(201);

    const modelId = create.body.id as string;
    const duplicateNameVariant = ` ${String(create.body.name).toUpperCase()} `;

    const list = await request(app.getHttpServer())
      .get('/api/v1/models')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const get = await request(app.getHttpServer())
      .get(`/api/v1/models/${modelId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(String(get.body.id).toLowerCase()).toBe(modelId.toLowerCase());

    const duplicate = await request(app.getHttpServer())
      .post('/api/v1/models')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: duplicateNameVariant, brandId });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('DUPLICATE_MODEL_NAME');

    const invalidPayload = await request(app.getHttpServer())
      .post('/api/v1/models')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A', brandId });
    expect(invalidPayload.status).toBe(400);

    const update = await request(app.getHttpServer())
      .patch(`/api/v1/models/${modelId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `${name} Updated` });
    expect(update.status).toBe(200);

    const remove = await request(app.getHttpServer())
      .delete(`/api/v1/models/${modelId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(200);

    const afterDelete = await request(app.getHttpServer())
      .get(`/api/v1/models/${modelId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(afterDelete.status).toBe(404);
    expect(afterDelete.body.code).toBe('MODEL_NOT_FOUND');

    const missing = await request(app.getHttpServer())
      .get(`/api/v1/models/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
    expect(missing.body.code).toBe('MODEL_NOT_FOUND');
  });
});
