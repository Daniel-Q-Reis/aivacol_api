import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createTestApp } from './helpers/test-app.factory';
import { loginAndGetToken } from './helpers/auth.helper';

function buildValidRenavam(base10Digits: string): string {
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const digits = base10Digits.split('').map(Number);
  const sum = digits.reduce((acc, digit, index) => acc + digit * weights[index], 0);
  const remainder = sum % 11;
  const checkDigit = remainder === 0 || remainder === 1 ? 0 : 11 - remainder;
  return `${base10Digits}${checkDigit}`;
}

describe('Vehicles (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let modelId: string;

  beforeAll(async () => {
    app = await createTestApp();
    token = await loginAndGetToken(app);

    const brand = await request(app.getHttpServer())
      .post('/api/v1/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `QA Vehicle Brand ${Date.now()}` });

    const model = await request(app.getHttpServer())
      .post('/api/v1/models')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `QA Vehicle Model ${Date.now()}`, brandId: brand.body.id });

    modelId = model.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces 401 without token on protected route', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/vehicles');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('supports CRUD flow, validation errors, and soft-delete recreate contract', async () => {
    const twoDigits = `${Date.now() % 100}`.padStart(2, '0');
    const oneDigit = twoDigits.slice(-1);
    const fiveDigits = `${Date.now() % 100000}`.padStart(5, '0');
    const renavamBase = `${Date.now() % 10000000000}`.padStart(10, '0');
    const basePayload = {
      licensePlate: `QAT${oneDigit}A${twoDigits}`,
      chassis: `9BWZZZ377VT0${fiveDigits}`,
      renavam: buildValidRenavam(renavamBase),
      year: 2024,
      modelId,
    };

    const create = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);
    expect(create.status).toBe(201);

    const vehicleId = create.body.id as string;

    const list = await request(app.getHttpServer())
      .get('/api/v1/vehicles?page=1&limit=10&sort=createdAt&order=desc')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.items)).toBe(true);

    const get = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(String(get.body.id).toLowerCase()).toBe(vehicleId.toLowerCase());

    const invalidPayload = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...basePayload, renavam: '123' });
    expect(invalidPayload.status).toBe(400);

    const update = await request(app.getHttpServer())
      .patch(`/api/v1/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2025 });
    expect(update.status).toBe(200);
    expect(update.body.year).toBe(2025);

    const remove = await request(app.getHttpServer())
      .delete(`/api/v1/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(200);

    const notFound = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(notFound.status).toBe(404);
    expect(notFound.body.code).toBe('VEHICLE_NOT_FOUND');

    // This regression case asserts ADR-004 behavior: same business keys can be reused after soft delete.
    const recreate = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);
    expect(recreate.status).toBe(201);

    const duplicateActive = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);
    expect(duplicateActive.status).toBe(409);
    expect(duplicateActive.body.code).toBe('DUPLICATE_LICENSE_PLATE');

    const randomMissing = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(randomMissing.status).toBe(404);
    expect(randomMissing.body.code).toBe('VEHICLE_NOT_FOUND');
  });
});
