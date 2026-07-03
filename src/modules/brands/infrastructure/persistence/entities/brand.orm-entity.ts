import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ModelOrmEntity } from '../../../../models/infrastructure/persistence/entities/model.orm-entity';

@Entity('brands')
export class BrandOrmEntity {
  @PrimaryColumn({ type: 'uniqueidentifier' })
  id!: string;

  @Column({ name: 'name', type: 'nvarchar', length: 120 })
  name!: string;

  @Column({ name: 'created_by', type: 'uniqueidentifier' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime2', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => ModelOrmEntity, (model) => model.brand)
  models!: ModelOrmEntity[];
}
