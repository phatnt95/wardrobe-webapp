import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item } from '../items/item.schema';
import { WeatherResponseDto } from '../weather/dto/weather-response.dto';
import { GeminiService } from '../chroma/gemini.service';
import { ChromaService } from '../chroma/chroma.service';
import { OotdResponseDto } from './dto/ootd-response.dto';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<Item>,
    private readonly geminiService: GeminiService,
    private readonly chromaService: ChromaService,
  ) { }

  async getOotd(userId: string, weather: WeatherResponseDto): Promise<any> {
    try {
      // BƯỚC 1: Xây dựng Query Ngữ cảnh (Context)
      const weatherContext = `Thời tiết hôm nay: ${weather.temperature}°C, ${weather.description}, độ ẩm ${weather.humidity}%. Tình trạng: ${weather.condition}.`;
      this.logger.log(`[RAG - Step 1] Ngữ cảnh: ${weatherContext}`);

      // BƯỚC 2: Sinh Vector cho Ngữ cảnh
      const queryVector = await this.geminiService.generateEmbedding(weatherContext);

      // BƯỚC 3: Truy xuất (Retrieval) Top 15 từ ChromaDB
      const topItemIds = await this.chromaService.querySimilarItems(userId, queryVector, 15);

      if (!topItemIds || topItemIds.length === 0) {
        this.logger.warn(`User ${userId} không có đồ nào hợp hoặc tủ đồ trống.`);
        return this.getFallbackOotd();
      }
      this.logger.log(`[RAG - Step 3] ChromaDB đề xuất ${topItemIds.length} món đồ phù hợp.`);

      // BƯỚC 4: Lấy chi tiết 15 món đồ từ MongoDB (Chỉ lấy text để tiết kiệm Token)
      const objectIds = topItemIds.map(id => new Types.ObjectId(id));
      const candidates = await this.itemModel
        .find({ _id: { $in: objectIds } })
        .select('_id name color category tags')
        .lean();

      // BƯỚC 5: Sinh kết quả (Generation) - Đưa cho Gemini Mix & Match
      const candidateContext = candidates.map(c => ({
        id: c._id.toString(),
        name: c.name,
        color: c.color,
        tags: c.tags
      }));

      const finalOutfitIds = await this.geminiService.generateOutfitFromCandidates(
        weatherContext,
        candidateContext
      );

      this.logger.log(`[RAG - Step 5] Gemini chọn ra ${finalOutfitIds.length} món đồ cuối cùng.`);
      // BƯỚC 6: Hydrate dữ liệu (Lấy full ảnh và thông tin từ DB để trả cho Frontend)
      const hydratedItems = await this.itemModel
        .find({ _id: { $in: finalOutfitIds.map(id => new Types.ObjectId(id)) } })
        .populate('category', 'name')
        .lean();

      return {
        items: hydratedItems,
        source: 'ai_rag',
        reason: 'Phối đồ dựa trên phân tích Vector thời tiết và AI Stylist.'
      };

    } catch (error) {
      this.logger.error('Lỗi luồng RAG OOTD, chuyển sang Fallback:', error);
      return this.getFallbackOotd(); // Nhớ giữ lại hàm fallback rule-based cũ của bạn nhé
    }
  }

  private getFallbackOotd(): Promise<any> {
    // Trả về logic Rule-Based mà bạn đã viết rất xịn ở file cũ
    return Promise.resolve({ items: [], source: 'fallback', reason: 'Rule-based logic' });
  }
}