import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ItemsModule } from './items/items.module';
import { LocationsModule } from './locations/locations.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { OutfitsModule } from './outfits/outfits.module';
import { WeatherModule } from './weather/weather.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GeminiModule } from './gemini/gemini.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksModule } from './webhooks/webhooks.module';
import { LicenseModule } from './license/license.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          username: configService.get('REDIS_USERNAME'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const port = configService.get('REDIS_PORT');
        const host = configService.get('REDIS_HOST');
        const username = configService.get('REDIS_USERNAME') || '';
        const password = configService.get('REDIS_PASSWORD') || '';
        const url = `redis://${username ? username + ':' : ''}${password ? password + '@' : ''}${host}:${port}`;
        return {
          stores: [createKeyv(url)],
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 5,
    }, {
      name: 'medium',
      ttl: 10000,
      limit: 20
    }, {
      name: 'long',
      ttl: 60000,
      limit: 100
    }]),
    CommonModule,
    UsersModule,
    AuthModule,
    ItemsModule,
    LocationsModule,
    FavoritesModule,
    CloudinaryModule,
    OutfitsModule,
    WeatherModule,
    RecommendationModule,
    DashboardModule,
    GeminiModule,
    NotificationsModule,
    EventsModule,
    WebhooksModule,
    LicenseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule { }
