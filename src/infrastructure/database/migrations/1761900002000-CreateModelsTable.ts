import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateModelsTable1761900002000 implements MigrationInterface {
  name = 'CreateModelsTable1761900002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // We model FK constraints explicitly to prevent orphaned aggregates when services are bypassed (manual SQL, scripts).
    await queryRunner.query(`
      CREATE TABLE models (
        id UNIQUEIDENTIFIER NOT NULL,
        name NVARCHAR(120) NOT NULL,
        brand_id UNIQUEIDENTIFIER NOT NULL,
        created_by UNIQUEIDENTIFIER NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_models_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_models_updated_at DEFAULT SYSUTCDATETIME(),
        deleted_at DATETIME2 NULL,
        CONSTRAINT PK_models PRIMARY KEY (id),
        CONSTRAINT FK_models_brand_id_brands FOREIGN KEY (brand_id) REFERENCES brands(id),
        CONSTRAINT FK_models_created_by_users FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IX_models_brand_id_active ON models (brand_id) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_models_brand_name_active ON models (brand_id, name) WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX UQ_models_brand_name_active ON models`);
    await queryRunner.query(`DROP INDEX IX_models_brand_id_active ON models`);
    await queryRunner.query(`DROP TABLE models`);
  }
}
