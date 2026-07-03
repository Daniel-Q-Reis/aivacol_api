import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBrandsTable1761900001000 implements MigrationInterface {
  name = 'CreateBrandsTable1761900001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Raw SQL keeps DDL deterministic across SQL Server versions and avoids ORM abstraction gaps in migrations.
    await queryRunner.query(`
      CREATE TABLE brands (
        id UNIQUEIDENTIFIER NOT NULL,
        name NVARCHAR(120) NOT NULL,
        created_by UNIQUEIDENTIFIER NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_brands_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_brands_updated_at DEFAULT SYSUTCDATETIME(),
        deleted_at DATETIME2 NULL,
        CONSTRAINT PK_brands PRIMARY KEY (id),
        CONSTRAINT FK_brands_created_by_users FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_brands_name_active ON brands (name) WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX UQ_brands_name_active ON brands`);
    await queryRunner.query(`DROP TABLE brands`);
  }
}
