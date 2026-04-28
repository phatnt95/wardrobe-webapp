import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from '../items/item.schema';
import { RecommendationService } from './recommendation.service';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [
    // Only inject the Item model — no full ItemsModule import to avoid circular deps
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    GeminiModule,
  ],
  providers: [RecommendationService],
  exports: [RecommendationService], // exported for DashboardModule
})
export class RecommendationModule {}
