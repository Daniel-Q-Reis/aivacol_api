import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1761900000000 implements MigrationInterface {
  name = 'CreateUsersTable1761900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // We keep user uniqueness scoped to active records so deactivated identities can be re-provisioned if needed.
    await queryRunner.query(`
      CREATE TABLE users (
        id UNIQUEIDENTIFIER NOT NULL,
        nickname NVARCHAR(80) NOT NULL,
        name NVARCHAR(120) NOT NULL,
        email NVARCHAR(254) NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        created_by UNIQUEIDENTIFIER NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
        deleted_at DATETIME2 NULL,
        CONSTRAINT PK_users PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_users_nickname_active ON users (nickname) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX UQ_users_email_active ON users (email) WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Down migration drops filtered indexes first to avoid dependency errors during table removal.
    await queryRunner.query(`DROP INDEX UQ_users_email_active ON users`);
    await queryRunner.query(`DROP INDEX UQ_users_nickname_active ON users`);
    await queryRunner.query(`DROP TABLE users`);
  }
}
