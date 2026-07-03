import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehiclesTable1761900003000 implements MigrationInterface {
  name = 'CreateVehiclesTable1761900003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE vehicles (
        id UNIQUEIDENTIFIER NOT NULL,
        license_plate NVARCHAR(7) NOT NULL,
        chassis NVARCHAR(17) NOT NULL,
        renavam NVARCHAR(11) NOT NULL,
        year INT NOT NULL,
        model_id UNIQUEIDENTIFIER NOT NULL,
        created_by UNIQUEIDENTIFIER NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_vehicles_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_vehicles_updated_at DEFAULT SYSUTCDATETIME(),
        deleted_at DATETIME2 NULL,
        CONSTRAINT PK_vehicles PRIMARY KEY (id),
        CONSTRAINT FK_vehicles_model_id_models FOREIGN KEY (model_id) REFERENCES models(id),
        CONSTRAINT FK_vehicles_created_by_users FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IX_vehicles_model_id_active ON vehicles (model_id) WHERE deleted_at IS NULL`,
    );
    // SQL Server filtered unique indexes enforce uniqueness only among active rows.
    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_vehicles_license_plate_active ON vehicles (license_plate) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_vehicles_chassis_active ON vehicles (chassis) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_vehicles_renavam_active ON vehicles (renavam) WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX UQ_vehicles_renavam_active ON vehicles`);
    await queryRunner.query(`DROP INDEX UQ_vehicles_chassis_active ON vehicles`);
    await queryRunner.query(`DROP INDEX UQ_vehicles_license_plate_active ON vehicles`);
    await queryRunner.query(`DROP INDEX IX_vehicles_model_id_active ON vehicles`);
    await queryRunner.query(`DROP TABLE vehicles`);
  }
}
