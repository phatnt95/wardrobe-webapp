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
import { ChromaModule } from './chroma/chroma.module';

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
    ChromaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
