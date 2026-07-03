import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ModelOrmEntity } from '../../../../models/infrastructure/persistence/entities/model.orm-entity';

@Entity('vehicles')
export class VehicleOrmEntity {
  @PrimaryColumn({ type: 'uniqueidentifier' })
  id!: string;

  @Column({ name: 'license_plate', type: 'nvarchar', length: 7 })
  licensePlate!: string;

  @Column({ name: 'chassis', type: 'nvarchar', length: 17 })
  chassis!: string;

  @Column({ name: 'renavam', type: 'nvarchar', length: 11 })
  renavam!: string;

  @Column({ name: 'year', type: 'int' })
  year!: number;

  @Column({ name: 'model_id', type: 'uniqueidentifier' })
  modelId!: string;

  @Column({ name: 'created_by', type: 'uniqueidentifier' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime2', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => ModelOrmEntity, (model) => model.vehicles, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'model_id' })
  model!: ModelOrmEntity;
}
