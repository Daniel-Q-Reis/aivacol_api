import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import dataSource from '../../../config/database.config';
import { UserOrmEntity } from '../../../modules/users/infrastructure/persistence/entities/user.orm-entity';
import { BrandOrmEntity } from '../../../modules/brands/infrastructure/persistence/entities/brand.orm-entity';
import { ModelOrmEntity } from '../../../modules/models/infrastructure/persistence/entities/model.orm-entity';
import { VehicleOrmEntity } from '../../../modules/vehicles/infrastructure/persistence/entities/vehicle.orm-entity';

interface SeedVehicleInput {
  licensePlate: string;
  chassis: string;
  renavam: string;
  year: number;
  brand: string;
  model: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSeedFile(): SeedVehicleInput[] {
  const filePath = resolve(process.cwd(), 'seed_vehicles.json');

  if (!existsSync(filePath)) {
    throw new Error('Missing required seed file: seed_vehicles.json');
  }

  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SeedVehicleInput[];
}

async function runSeed(): Promise<void> {
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(UserOrmEntity);
  const brandRepository = dataSource.getRepository(BrandOrmEntity);
  const modelRepository = dataSource.getRepository(ModelOrmEntity);
  const vehicleRepository = dataSource.getRepository(VehicleOrmEntity);

  const seedNickname = getRequiredEnv('SEED_USER_NICKNAME').trim().toLowerCase();
  const seedName = getRequiredEnv('SEED_USER_NAME');
  const seedEmail = getRequiredEnv('SEED_USER_EMAIL').trim().toLowerCase();
  const seedPassword = getRequiredEnv('SEED_USER_PASSWORD');

  const seedVehicles = getSeedFile();
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  let defaultUser = await userRepository
    .createQueryBuilder('user')
    .addSelect('user.password_hash')
    .where('LOWER(user.nickname) = :nickname', { nickname: seedNickname })
    .andWhere('user.deleted_at IS NULL')
    .getOne();

  if (!defaultUser) {
    defaultUser = userRepository.create({
      id: randomUUID(),
      nickname: seedNickname,
      name: seedName,
      email: seedEmail,
      passwordHash,
      createdBy: '00000000-0000-0000-0000-000000000001',
    });

    defaultUser.createdBy = defaultUser.id;
    defaultUser = await userRepository.save(defaultUser);
    console.log(`[seed] created default user '${seedNickname}'`);
  } else {
    // Idempotency rule: always refresh default credentials to keep local environments deterministic.
    defaultUser.name = seedName;
    defaultUser.email = seedEmail;
    defaultUser.passwordHash = passwordHash;
    await userRepository.save(defaultUser);
    console.log(`[seed] updated default user '${seedNickname}'`);
  }

  const brandByName = new Map<string, BrandOrmEntity>();
  const modelByCompositeKey = new Map<string, ModelOrmEntity>();

  for (const item of seedVehicles) {
    const normalizedBrandName = item.brand.trim();
    const normalizedModelName = item.model.trim();
    const brandKey = normalizedBrandName.toLowerCase();
    const modelKey = `${brandKey}::${normalizedModelName.toLowerCase()}`;

    let brand: BrandOrmEntity | undefined = brandByName.get(brandKey) ?? undefined;
    if (!brand) {
      const brandFromDb = await brandRepository.findOne({
        where: { name: normalizedBrandName },
      });

      brand = brandFromDb ?? undefined;

      if (!brand) {
        brand = await brandRepository.save(
          brandRepository.create({
            id: randomUUID(),
            name: normalizedBrandName,
            createdBy: defaultUser.id,
          }),
        );
        console.log(`[seed] created brand '${normalizedBrandName}'`);
      }

      brandByName.set(brandKey, brand);
    }

    let model: ModelOrmEntity | undefined = modelByCompositeKey.get(modelKey) ?? undefined;
    if (!model) {
      const modelFromDb = await modelRepository.findOne({
        where: {
          brandId: brand.id,
          name: normalizedModelName,
        },
      });

      model = modelFromDb ?? undefined;

      if (!model) {
        model = await modelRepository.save(
          modelRepository.create({
            id: randomUUID(),
            brandId: brand.id,
            name: normalizedModelName,
            createdBy: defaultUser.id,
          }),
        );
        console.log(`[seed] created model '${normalizedModelName}' for '${normalizedBrandName}'`);
      }

      modelByCompositeKey.set(modelKey, model);
    }

    const normalizedLicensePlate = item.licensePlate.trim().toUpperCase();
    const normalizedChassis = item.chassis.trim().toUpperCase();
    const normalizedRenavam = item.renavam.trim();

    const existingVehicle = await vehicleRepository.findOne({
      where: [
        { licensePlate: normalizedLicensePlate },
        { chassis: normalizedChassis },
        { renavam: normalizedRenavam },
      ],
    });

    if (!existingVehicle) {
      await vehicleRepository.save(
        vehicleRepository.create({
          id: randomUUID(),
          licensePlate: normalizedLicensePlate,
          chassis: normalizedChassis,
          renavam: normalizedRenavam,
          year: item.year,
          modelId: model.id,
          createdBy: defaultUser.id,
        }),
      );
      console.log(`[seed] created vehicle '${normalizedLicensePlate}'`);
      continue;
    }

    existingVehicle.modelId = model.id;
    existingVehicle.licensePlate = normalizedLicensePlate;
    existingVehicle.chassis = normalizedChassis;
    existingVehicle.renavam = normalizedRenavam;
    existingVehicle.year = item.year;
    await vehicleRepository.save(existingVehicle);
    console.log(`[seed] updated vehicle '${normalizedLicensePlate}'`);
  }
}

runSeed()
  .then(async () => {
    console.log('[seed] completed successfully');
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  })
  .catch(async (error) => {
    console.error(`[seed] failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exitCode = 1;
  });
