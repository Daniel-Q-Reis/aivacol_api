import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ModelsModule } from './modules/models/models.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getAuditConfig } from './config/audit.config';
import { getTypeOrmModuleOptions } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => getTypeOrmModuleOptions(),
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const auditConfig = getAuditConfig();
        return {
          uri: auditConfig.uri,
        };
      },
    }),
    EventEmitterModule.forRoot(),
    VehiclesModule,
    ModelsModule,
    BrandsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
