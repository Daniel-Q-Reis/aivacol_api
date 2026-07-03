import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrandOrmEntity } from '../../../../brands/infrastructure/persistence/entities/brand.orm-entity';
import { VehicleOrmEntity } from '../../../../vehicles/infrastructure/persistence/entities/vehicle.orm-entity';

@Entity('models')
export class ModelOrmEntity {
  @PrimaryColumn({ type: 'uniqueidentifier' })
  id!: string;

  @Column({ name: 'name', type: 'nvarchar', length: 120 })
  name!: string;

  @Column({ name: 'brand_id', type: 'uniqueidentifier' })
  brandId!: string;

  @Column({ name: 'created_by', type: 'uniqueidentifier' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime2', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => BrandOrmEntity, (brand) => brand.models, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'brand_id' })
  brand!: BrandOrmEntity;

  @OneToMany(() => VehicleOrmEntity, (vehicle) => vehicle.model)
  vehicles!: VehicleOrmEntity[];
}
