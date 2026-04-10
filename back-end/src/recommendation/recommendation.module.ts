import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from '../items/item.schema';
import { RecommendationService } from './recommendation.service';
import { GeminiService } from 'src/chroma/gemini.service';
import { ChromaService } from 'src/chroma/chroma.service';

@Module({
  imports: [
    // Only inject the Item model — no full ItemsModule import to avoid circular deps
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
  ],
  providers: [RecommendationService, GeminiService, ChromaService],
  exports: [RecommendationService], // exported for DashboardModule
})
export class RecommendationModule {}
