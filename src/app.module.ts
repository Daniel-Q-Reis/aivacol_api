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
    // Keep infrastructure bootstrap deferred to runtime env validation.
    TypeOrmModule.forRootAsync({
      useFactory: async () => getTypeOrmModuleOptions(),
    }),
    // MongoDB is used for audit trail and must not block SQL bootstrap logic.
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const auditConfig = getAuditConfig();
        return {
          uri: auditConfig.uri,
        };
      },
    }),
    EventEmitterModule.forRoot(),
    // Feature modules are wired early as placeholders to stabilize imports and DI graph.
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
