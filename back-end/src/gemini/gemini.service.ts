import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private gemini: GoogleGenerativeAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.gemini = new GoogleGenerativeAI(apiKey);
      this.logger.log('Đã khởi tạo Google Generative AI Client.');
    } else {
      this.logger.error('Không tìm thấy GEMINI_API_KEY trong biến môi trường!');
    }
  }

  /**
   * Sinh mảng Vector (Embedding) từ một chuỗi văn bản
   * @param text Chuỗi văn bản cần chuyển đổi (VD: "Áo khoác gió mùa đông màu đen...")
   * @returns Mảng số thực (Ví dụ: [0.012, -0.045, 0.88, ...])
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.gemini) {
      this.logger.warn('Gemini Client chưa được khởi tạo. Trả về mảng rỗng.');
      return [];
    }

    try {
      // SỬ DỤNG ĐÚNG MODEL: 'gemini-embedding-001' chuyên dùng để sinh vector
      // Tuyệt đối không dùng các model như 'gemini-1.5-flash' ở đây vì chúng dùng để sinh text
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-embedding-001',
      });

      const result = await model.embedContent(text);
      const embedding = result.embedding;

      return embedding.values; // Trả về mảng Float
    } catch (error) {
      this.logger.error(
        `Lỗi khi sinh Embedding cho text: "${text.substring(0, 30)}..."`,
        error,
      );
      // Ném lỗi ra ngoài để service gọi nó (ItemService) biết đường xử lý rollback nếu cần
      throw error;
    }
  }

  /**
   * Bước Generation (G) trong RAG: AI Stylist chốt bộ đồ từ danh sách đề xuất
   * @param weatherContext Chuỗi miêu tả thời tiết
   * @param candidates Mảng JSON chứa Top 15 món đồ lấy từ MongoDB Atlas Vector Search
   * @returns Mảng các ID (string) của những món đồ được chọn
   */
  async generateOutfitFromCandidates(
    weatherContext: string,
    candidates: any[],
  ): Promise<string[]> {
    if (!this.gemini) {
      this.logger.warn('Gemini Client chưa khởi tạo. Trả về mảng rỗng.');
      return [];
    }

    if (!candidates || candidates.length === 0) {
      return [];
    }

    try {
      // 1. CẤU HÌNH MODEL: Ép chuẩn JSON và hạ Temperature để tăng tính logic
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-3.1-flash-lite-preview',
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      // 2. PROMPT ENGINEERING
      const systemPrompt = `
            You are a professional AI Fashion Stylist.
            Your task is to select ONE complete outfit (Outfit Of The Day - OOTD) from the provided list of clothing that best suits the current weather.

            TODAY'S WEATHER CONTEXT:
            ${weatherContext}

            PROPOSED WARDROBE (Only select items from this list):
            ${JSON.stringify(candidates, null, 5)}

            OUTFIT REQUIREMENTS:
            1. Select items to form 1 complete outfit (e.g., 1 top + 1 bottom; add outerwear if it is cold/raining).
            2. Pay close attention to 'color' and 'category/style' to ensure they coordinate harmoniously.
            3. DO NOT hallucinate or invent new IDs. ONLY use the IDs explicitly provided in the PROPOSED WARDROBE list.
            4. MOST IMPORTANT RULE (ESCAPE HATCH): If the PROPOSED WARDROBE consists entirely of items that are completely unwearable in the current weather (e.g., -8°C but only short-sleeve shirts are available, or rainy but only easily damaged materials exist), YOU MUST REFUSE to style by returning an empty array [] for 'selectedIds'. Do not force a selection if it is impractical, ridiculous, or poses a health risk.

            OUTPUT FORMAT:
            You must return ONLY a valid JSON object with the following schema (do not include any markdown fences, code blocks, or conversational text outside the JSON):
            {
                "selectedIds": ["id_1", "id_2", "id_3", "id_4"],
                "reason": "A brief 1-sentence explanation of why this outfit was chosen. If returning [], explain that the wardrobe lacks suitable clothing for the current weather."
            }
            `.trim();
      // 3. GỌI GEMINI
      const geminiCall = model.generateContent(systemPrompt);
      const result = await Promise.race([geminiCall]);

      const rawText = result.response.text().trim();
      this.logger.log(`Gemini trả về JSON thô: ${rawText}`);

      // 4. PARSE JSON
      const parsed = JSON.parse(rawText);

      // 5. VALIDATE & RETURN
      if (parsed.selectedIds && Array.isArray(parsed.selectedIds)) {
        return parsed.selectedIds;
      }
    } catch (error) {
      this.logger.error('Error when generate outfit:', error);
      return [];
    }

    return [];
  }

  async autoDetectAttributes(
    imageUrl: string,
    options?: {
      categories?: string[];
      styles?: string[];
      occasions?: string[];
      brands?: string[];
      seasonCodes?: string[];
      sleeveLengths?: string[];
      necklines?: string[];
      shoulders?: string[];
      sizes?: string[];
    },
  ): Promise<any> {
    if (!this.gemini) {
      this.logger.warn('Gemini Client chưa khởi tạo.');
      throw new Error('Gemini missing');
    }
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const categoryProp: any = { type: SchemaType.STRING, description: 'Main category name' };
      if (options?.categories && options.categories.length > 0) categoryProp.enum = options.categories;

      const styleProp: any = { type: SchemaType.STRING, description: 'Overall fashion style' };
      if (options?.styles && options.styles.length > 0) styleProp.enum = options.styles;

      const occasionProp: any = { type: SchemaType.STRING, description: 'Suitable occasions' };
      if (options?.occasions && options.occasions.length > 0) occasionProp.enum = options.occasions;

      const seasonCodeProp: any = { type: SchemaType.STRING, description: 'Season code (e.g. Summer, Winter)' };
      if (options?.seasonCodes && options.seasonCodes.length > 0) seasonCodeProp.enum = options.seasonCodes;

      const sleeveLengthProp: any = { type: SchemaType.STRING, description: 'Sleeve length' };
      if (options?.sleeveLengths && options.sleeveLengths.length > 0) sleeveLengthProp.enum = options.sleeveLengths;

      const necklineProp: any = { type: SchemaType.STRING, description: 'Neckline style' };
      if (options?.necklines && options.necklines.length > 0) necklineProp.enum = options.necklines;

      const brandProp: any = { type: SchemaType.STRING, description: 'Brand name' };
      if (options?.brands && options.brands.length > 0) brandProp.enum = options.brands;

      const shoulderProp: any = { type: SchemaType.STRING, description: 'Shoulder fit' };
      if (options?.shoulders && options.shoulders.length > 0) shoulderProp.enum = options.shoulders;

      const sizeProp: any = { type: SchemaType.STRING, description: 'Size' };
      if (options?.sizes && options.sizes.length > 0) sizeProp.enum = options.sizes;

      const structuredOutput: any = {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "A short descriptive name" },
          category: categoryProp,
          color: { type: SchemaType.STRING, description: 'Dominant color names' },
          style: styleProp,
          occasion: occasionProp,
          seasonCode: seasonCodeProp,
          sleeveLength: sleeveLengthProp,
          neckline: necklineProp,
          brand: brandProp,
          shoulder: shoulderProp,
          size: sizeProp,
        },
        required: ['name', 'category', 'color', 'style', 'occasion'],
      };

      const model = this.gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: structuredOutput, //force response to be json
        },
      });

      const prompt = `
        Analyze this clothing item and extract the following details. Return ONLY a valid JSON object matching the exact schema below:
        {
            "name": "A short descriptive name (e.g. 'Blue Denim Jacket')",
            "category": "Main category name (e.g. 'Jacket', 'T-Shirt', 'Dress')",
            "color": "Dominant color names (e.g. 'Blue', 'White')",
            "style": "Overall fashion style (e.g. 'Casual', 'Formal', 'Sporty')",
            "occasion": "Suitable occasions (e.g. 'Casual', 'Work', 'Party')",
            "seasonCode": "Season (e.g. 'Summer', 'Winter', 'All Season')",
            "sleeveLength": "Sleeve length (e.g. 'Short Sleeve', 'Long Sleeve', 'Sleeveless')",
            "neckline": "Neckline (e.g. 'Round', 'V-Neck')",
            "brand": "Brand name, if visible or identifiable",
            "shoulder": "Shoulder fit (e.g. 'Regular', 'Drop', 'Padded')",
            "size": "Size, if visible"
        }
        Do not include any text outside the JSON.
      `;

      const result = await model.generateContent([
        {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: response.headers.get('content-type') || 'image/jpeg',
          },
        },
        prompt,
      ]);

      const rawText = result.response.text().trim();
      const parsed = JSON.parse(rawText);
      this.logger.log(`Gemini trả về JSON thô: ${parsed}`);
      return parsed;
    } catch (error) {
      this.logger.error('Error auto-detecting attributes', error);
      throw error;
    }
  }
}
