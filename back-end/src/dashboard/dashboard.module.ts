import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from '../items/item.schema';
import { WeatherModule } from '../weather/weather.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    // Item model for recent items + stats queries
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    // Import modules that export the services we need
    WeatherModule,
    RecommendationModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
