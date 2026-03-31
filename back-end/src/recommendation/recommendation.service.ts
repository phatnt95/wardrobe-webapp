import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Item } from '../items/item.schema';
import { WeatherResponseDto } from '../weather/dto/weather-response.dto';
import { OotdResponseDto, WardrobeItemContextDto } from './dto/ootd-response.dto';

// Condition → warm/cool/cold/rainy categories to guide fallback logic
const WARM_CONDITIONS = ['Clear', 'Haze', 'Mist'];
const RAINY_CONDITIONS = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'];

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly gemini: GoogleGenerativeAI | null = null;
  private readonly GEMINI_TIMEOUT_MS = 5000;

  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<Item>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.gemini = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY is not set — AI recommendations will use rule-based fallback.');
    }
  }

  // ─── Public method called by DashboardModule ──────────────────────────────
  async getOotd(userId: string, weather: WeatherResponseDto): Promise<OotdResponseDto> {
    // 1. Fetch only text-based metadata — no image URLs (token optimisation per spec)
    const wardrobeContext = await this.buildWardrobeContext(userId);

    if (wardrobeContext.length === 0) {
      return { items: [], source: 'fallback', reason: 'No items in wardrobe.' };
    }

    // 2. Try Gemini AI with hard timeout
    if (this.gemini) {
      try {
        return await this.getAiRecommendation(wardrobeContext, weather, userId);
      } catch (err) {
        this.logger.error('Gemini call failed, falling back to rule-based logic.', err);
      }
    }

    // 3. Rule-based fallback
    return this.getRuleBasedFallback(wardrobeContext, weather, userId);
  }

  // ─── Wardrobe context builder (token-optimised) ───────────────────────────
  private async buildWardrobeContext(userId: string): Promise<WardrobeItemContextDto[]> {
    const items = await this.itemModel
      .find({ owner: new Types.ObjectId(userId) })
      // Select ONLY text-based fields — no image URLs
      .select('_id name color tags')
      .populate('category', 'name')
      .lean()
      .exec();

    return items.map((item: any) => ({
      id: item._id.toString(),
      name: item.name,
      category: item.category?.name ?? 'Unknown',
      color: item.color ?? 'Unknown',
      tags: item.tags ?? [],
    }));
  }

  // ─── Gemini AI path ───────────────────────────────────────────────────────
  private async getAiRecommendation(
    wardrobe: WardrobeItemContextDto[],
    weather: WeatherResponseDto,
    userId: string,
  ): Promise<OotdResponseDto> {
    const model = this.gemini!.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `
You are an expert Fashion Stylist AI. Your task is to select the best Outfit Of The Day (OOTD) from a user's wardrobe based on the current weather.

Current Weather:
- City: ${weather.cityName}
- Temperature: ${weather.temperature}°C (feels like ${weather.feelsLike}°C)
- Condition: ${weather.condition} (${weather.description})
- Humidity: ${weather.humidity}%

User's Wardrobe (JSON array — text-only for privacy):
${JSON.stringify(wardrobe, null, 2)}

Instructions:
1. Select 2–4 items that form a complete, weather-appropriate outfit (e.g., top + bottom, or top + jacket + bottom).
2. Consider the temperature and condition: light fabrics for heat, layers for cold, waterproof options for rain.
3. Prefer colour combinations that work well together.
4. You MUST respond with ONLY a valid JSON object in this exact format, with no extra text, markdown, or explanation:
{"selectedIds": ["id1", "id2", "id3"], "reason": "Brief one-sentence explanation."}
`.trim();

    // Hard timeout via Promise.race
    const geminiCall = model.generateContent(systemPrompt);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), this.GEMINI_TIMEOUT_MS),
    );

    const result = await Promise.race([geminiCall, timeoutPromise]);
    const rawText = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    let parsed: { selectedIds: string[]; reason: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${rawText}`);
    }

    if (!Array.isArray(parsed.selectedIds) || parsed.selectedIds.length === 0) {
      throw new Error('Gemini returned empty selectedIds');
    }

    // Hydrate IDs → full items with images from DB
    const hydratedItems = await this.hydrateItems(parsed.selectedIds);

    return { items: hydratedItems, source: 'ai', reason: parsed.reason };
  }

  // ─── Rule-based fallback ──────────────────────────────────────────────────
  private async getRuleBasedFallback(
    wardrobe: WardrobeItemContextDto[],
    weather: WeatherResponseDto,
    _userId: string,
  ): Promise<OotdResponseDto> {
    this.logger.log('Using rule-based fallback for OOTD.');

    const isRainy = RAINY_CONDITIONS.includes(weather.condition);
    const isCold = weather.temperature < 18;
    const isWarm = weather.temperature >= 25;

    const tops = wardrobe.filter(i =>
      ['Top', 'Shirt', 'T-Shirt', 'Blouse', 'Sweater', 'Hoodie', 'Jacket', 'Coat'].some(c =>
        i.category.toLowerCase().includes(c.toLowerCase()),
      ),
    );
    const bottoms = wardrobe.filter(i =>
      ['Bottom', 'Pants', 'Skirt', 'Shorts', 'Jeans', 'Trouser'].some(c =>
        i.category.toLowerCase().includes(c.toLowerCase()),
      ),
    );
    const outers = wardrobe.filter(i =>
      ['Jacket', 'Coat', 'Outerwear', 'Cardigan'].some(c =>
        i.category.toLowerCase().includes(c.toLowerCase()),
      ),
    );

    const selected: string[] = [];

    // Pick one top
    const top = this.pickRandom(tops);
    if (top) selected.push(top.id);

    // Pick one bottom
    const bottom = this.pickRandom(bottoms);
    if (bottom) selected.push(bottom.id);

    // Add outer layer if cold or rainy
    if ((isCold || isRainy) && outers.length > 0) {
      const outer = this.pickRandom(outers);
      if (outer && !selected.includes(outer.id)) selected.push(outer.id);
    }

    // Fallback: if no structured picks, just grab 2 random items
    if (selected.length === 0) {
      const random = this.pickRandom(wardrobe);
      if (random) selected.push(random.id);
    }

    const hydratedItems = await this.hydrateItems(selected);

    const reason = isRainy
      ? 'Rule-based: Rainy weather — selected layered outfit.'
      : isCold
        ? 'Rule-based: Cold weather — included an outer layer.'
        : isWarm
          ? 'Rule-based: Warm weather — selected light clothing.'
          : 'Rule-based: Mild weather — a standard everyday outfit.';

    return { items: hydratedItems, source: 'fallback', reason };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private async hydrateItems(ids: string[]) {
    const objectIds = ids
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    const items = await this.itemModel
      .find({ _id: { $in: objectIds } })
      .select('_id name color images')
      .populate('category', 'name')
      .lean()
      .exec();

    return items.map((item: any) => ({
      _id: item._id.toString(),
      name: item.name,
      category: item.category?.name ?? 'Unknown',
      color: item.color ?? '',
      images: item.images ?? [],
    }));
  }

  private pickRandom<T>(arr: T[]): T | null {
    if (!arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
