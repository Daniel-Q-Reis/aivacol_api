import { Module } from '@nestjs/common';
import { CACHE_SERVICE } from '../../common/domain/interfaces/cache-service.interface';
import { RedisCacheService } from './redis-cache.service';

@Module({
  providers: [
    RedisCacheService,
    {
      provide: CACHE_SERVICE,
      useExisting: RedisCacheService,
    },
  ],
  exports: [CACHE_SERVICE, RedisCacheService],
})
export class CacheModule {}
