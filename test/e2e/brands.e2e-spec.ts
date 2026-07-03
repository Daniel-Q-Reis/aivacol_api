import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createTestApp } from './helpers/test-app.factory';
import { loginAndGetToken } from './helpers/auth.helper';

describe('Brands (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    token = await loginAndGetToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('performs CRUD and validates 404/409 contracts', async () => {
    const name = `QA Brand ${Date.now()}`;

    const create = await request(app.getHttpServer())
      .post('/api/v1/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name });
    expect(create.status).toBe(201);
    expect(create.body.name).toBe(name);

    const id = create.body.id as string;

    const list = await request(app.getHttpServer())
      .get('/api/v1/brands')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const get = await request(app.getHttpServer())
      .get(`/api/v1/brands/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(String(get.body.id).toLowerCase()).toBe(id.toLowerCase());

    const duplicate = await request(app.getHttpServer())
      .post('/api/v1/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: ` ${name.toUpperCase()} ` });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('DUPLICATE_BRAND_NAME');

    const update = await request(app.getHttpServer())
      .patch(`/api/v1/brands/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `${name} Updated` });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe(`${name} Updated`);

    const remove = await request(app.getHttpServer())
      .delete(`/api/v1/brands/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(200);

    // This case protects soft-delete regressions where removed entities still resolve as active records.
    const afterDelete = await request(app.getHttpServer())
      .get(`/api/v1/brands/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(afterDelete.status).toBe(404);
    expect(afterDelete.body.code).toBe('BRAND_NOT_FOUND');

    const missing = await request(app.getHttpServer())
      .get(`/api/v1/brands/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
    expect(missing.body.code).toBe('BRAND_NOT_FOUND');
  });
});
