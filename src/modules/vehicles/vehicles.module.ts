import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from '../../infrastructure/messaging/messaging.module';
import { VEHICLE_REPOSITORY } from './domain/interfaces/vehicle-repository.interface';
import { VehicleMessagingListener } from './infrastructure/listeners/vehicle-messaging.listener';
import { VehicleOrmEntity } from './infrastructure/persistence/entities/vehicle.orm-entity';
import { TypeOrmVehicleRepository } from './infrastructure/persistence/repositories/typeorm-vehicle.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleOrmEntity]), MessagingModule],
  providers: [
    TypeOrmVehicleRepository,
    VehicleMessagingListener,
    {
      provide: VEHICLE_REPOSITORY,
      useExisting: TypeOrmVehicleRepository,
    },
  ],
  exports: [VEHICLE_REPOSITORY],
})
export class VehiclesModule {}
