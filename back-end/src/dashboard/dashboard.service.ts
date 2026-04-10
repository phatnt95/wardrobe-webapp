import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item } from '../items/item.schema';
import { WeatherService } from '../weather/weather.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import {
  DashboardResponseDto,
  RecentItemDto,
  WardrobeStatsDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<Item>,
    private readonly weatherService: WeatherService,
    private readonly recommendationService: RecommendationService,
  ) {}

  async getHomeDashboard(
    userId: string,
    lat: number,
    lon: number,
  ): Promise<DashboardResponseDto> {
    // ── Step 1: Fetch weather (cached) ───────────────────────────────────────
    this.logger.log(`[Dashboard] Fetching weather for lat=${lat}, lon=${lon}`);
    const weather = await this.weatherService.getWeather(lat, lon);

    // ── Step 2 & 3: Fetch OOTD (weather is passed so Gemini has full context) ─
    // Step 4: Fetch auxiliary data (recent items + stats) runs IN PARALLEL with
    // OOTD to minimise total response time
    this.logger.log(
      `[Dashboard] Starting parallel fetch: OOTD + recent items + stats`,
    );

    const [ootd, recentItems, stats] = await Promise.all([
      this.recommendationService.getOotd(userId, weather),
      this.fetchRecentItems(userId),
      this.fetchWardrobeStats(userId),
    ]);

    // ── Step 5: Aggregate & return ────────────────────────────────────────────
    this.logger.log(`[Dashboard] Aggregation complete for user ${userId}`);

    return { weather, ootd, recentItems, stats };
  }

  // ─── Auxiliary: Last 5 items added ───────────────────────────────────────
  private async fetchRecentItems(userId: string): Promise<RecentItemDto[]> {
    const items = await this.itemModel
      .find({ owner: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id name color images createdAt')
      .populate('category', 'name')
      .lean()
      .exec();

    return items.map((item: any) => ({
      _id: item._id.toString(),
      name: item.name,
      category: item.category?.name ?? 'Unknown',
      color: item.color ?? '',
      images: item.images ?? [],
      createdAt: item.createdAt?.toISOString?.() ?? '',
    }));
  }

  // ─── Auxiliary: Wardrobe stats widget ─────────────────────────────────────
  private async fetchWardrobeStats(userId: string): Promise<WardrobeStatsDto> {
    const [totalItems, aggregate] = await Promise.all([
      this.itemModel.countDocuments({ owner: new Types.ObjectId(userId) }),
      this.itemModel.aggregate([
        { $match: { owner: new Types.ObjectId(userId) } },
        { $group: { _id: null, totalValue: { $sum: '$price' } } },
      ]),
    ]);

    return {
      totalItems,
      totalValue: aggregate[0]?.totalValue ?? 0,
    };
  }
}
