import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';

@Module({
  imports: [
    HttpModule,
    // In-memory cache with 30 min default TTL
    // Note: WeatherService overrides TTL per-key, this is just the module default
    CacheModule.register({
      ttl: 30 * 60 * 1000, // 30 minutes
      max: 100,             // max 100 entries
    }),
  ],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService], // exported so DashboardModule can inject it later
})
export class WeatherModule {}
