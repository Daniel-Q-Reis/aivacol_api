import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { MessagingModule } from '../../infrastructure/messaging/messaging.module';
import { ModelsModule } from '../models/models.module';
import { VehicleService } from './application/services/vehicle.service';
import { VEHICLE_REPOSITORY } from './domain/interfaces/vehicle-repository.interface';
import { VehicleMessagingListener } from './infrastructure/listeners/vehicle-messaging.listener';
import { VehicleOrmEntity } from './infrastructure/persistence/entities/vehicle.orm-entity';
import { TypeOrmVehicleRepository } from './infrastructure/persistence/repositories/typeorm-vehicle.repository';
import { VehicleController } from './presentation/controllers/vehicle.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleOrmEntity]),
    MessagingModule,
    ModelsModule,
    CacheModule,
  ],
  controllers: [VehicleController],
  providers: [
    TypeOrmVehicleRepository,
    VehicleService,
    VehicleMessagingListener,
    {
      provide: VEHICLE_REPOSITORY,
      useExisting: TypeOrmVehicleRepository,
    },
  ],
  exports: [VEHICLE_REPOSITORY, VehicleService],
})
export class VehiclesModule {}
