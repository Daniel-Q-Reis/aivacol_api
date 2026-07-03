import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn({ type: 'uniqueidentifier' })
  id!: string;

  @Column({ name: 'nickname', type: 'nvarchar', length: 80 })
  nickname!: string;

  @Column({ name: 'name', type: 'nvarchar', length: 120 })
  name!: string;

  @Column({ name: 'email', type: 'nvarchar', length: 254 })
  email!: string;

  @Column({ name: 'password_hash', type: 'nvarchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ name: 'created_by', type: 'uniqueidentifier' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime2', nullable: true })
  deletedAt!: Date | null;
}
