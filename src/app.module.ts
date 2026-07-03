import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ModelsModule } from './modules/models/models.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AuditModule } from './infrastructure/audit/audit.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { HealthController } from './common/controllers/health.controller';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ThrottlerGuard } from './common/guards/throttler.guard';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getAuditConfig } from './config/audit.config';
import { getTypeOrmModuleOptions } from './config/database.config';
import { getThrottleConfig } from './config/throttle.config';
import { GracefulShutdownService } from './infrastructure/lifecycle/graceful-shutdown.service';

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
    ThrottlerModule.forRootAsync({
      useFactory: async () => {
        const throttleConfig = getThrottleConfig();

        return [
          {
            ttl: throttleConfig.ttlSeconds * 1000,
            limit: throttleConfig.limit,
          },
        ];
      },
    }),
    // Feature modules are wired early as placeholders to stabilize imports and DI graph.
    CacheModule,
    AuditModule,
    VehiclesModule,
    ModelsModule,
    BrandsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    GracefulShutdownService,
    {
      // Keep the generic filter first so throttler-specific handling can override 429 payloads.
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      // Registered after global filter to ensure RATE_LIMIT_EXCEEDED contract wins for 429.
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Correlation ID must be attached before guards/interceptors for end-to-end traceability.
    consumer.apply(CorrelationIdMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
