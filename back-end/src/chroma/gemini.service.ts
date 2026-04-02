import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
            // SỬ DỤNG ĐÚNG MODEL: 'text-embedding-004' chuyên dùng để sinh vector
            // Tuyệt đối không dùng các model như 'gemini-1.5-flash' ở đây vì chúng dùng để sinh text
            const model = this.gemini.getGenerativeModel({
                model: 'gemini-embedding-001'
            });

            const result = await model.embedContent(text);
            const embedding = result.embedding;

            return embedding.values; // Trả về mảng Float

        } catch (error) {
            this.logger.error(`Lỗi khi sinh Embedding cho text: "${text.substring(0, 30)}..."`, error);
            // Ném lỗi ra ngoài để service gọi nó (ItemService) biết đường xử lý rollback nếu cần
            throw error;
        }
    }

    /**
   * Bước Generation (G) trong RAG: AI Stylist chốt bộ đồ từ danh sách đề xuất
   * @param weatherContext Chuỗi miêu tả thời tiết
   * @param candidates Mảng JSON chứa Top 15 món đồ lấy từ ChromaDB
   * @returns Mảng các ID (string) của những món đồ được chọn
   */
    async generateOutfitFromCandidates(
        weatherContext: string,
        candidates: any[]
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
                    responseMimeType: "application/json",
                }
            });

            // 2. PROMPT ENGINEERING
            const systemPrompt = `
            Bạn là một Stylist thời trang AI chuyên nghiệp.
            Nhiệm vụ của bạn là chọn ra MỘT bộ trang phục hoàn chỉnh (Outfit Of The Day - OOTD) từ danh sách quần áo cho sẵn, sao cho phù hợp nhất với thời tiết.

            NGỮ CẢNH THỜI TIẾT HÔM NAY:
            ${weatherContext}

            TỦ ĐỒ ĐỀ XUẤT (Chỉ chọn đồ trong danh sách này):
            ${JSON.stringify(candidates, null, 2)}

            YÊU CẦU PHỐI ĐỒ:
            1. Chọn ra các món đồ để tạo thành 1 bộ hoàn chỉnh (Ví dụ: 1 áo + 1 quần, thêm áo khoác ngoài nếu trời rét/mưa).
            2. Chú ý đến 'color' và 'category/style' để chúng phối với nhau hài hòa.
            3. KHÔNG ĐƯỢC bịa ra ID mới. CHỈ sử dụng ID có trong tủ đồ đề xuất.

            ĐỊNH DẠNG ĐẦU RA:
            Bắt buộc trả về duy nhất một object JSON với schema sau (không kèm text giải thích bên ngoài):
            {
                "selectedIds": ["id_mon_1", "id_mon_2"],
                "reason": "Giải thích ngắn gọn 1 câu lý do chọn bộ đồ này."
            }
            `;
            // 3. CHUẨN BỊ TIMEOUT 5 GIÂY (Tránh treo API)
            const TIMEOUT_MS = 5000;
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Gemini API Timeout quá 5s')), TIMEOUT_MS)
            );

            // 4. CHẠY ĐUA (RACE) GIỮA GEMINI VÀ TIMEOUT
            const geminiCall = model.generateContent(systemPrompt);
            const result = await Promise.race([geminiCall, timeoutPromise]);

            const rawText = result.response.text().trim();
            this.logger.log(`Gemini trả về JSON thô: ${rawText}`);

            // 5. PARSE JSON
            const parsed = JSON.parse(rawText);

            // 6. VALIDATE & RETURN
            if (parsed.selectedIds && Array.isArray(parsed.selectedIds)) {
                return parsed.selectedIds;
            }

        } catch (error) {
            this.logger.error('Lỗi khi parse JSON từ Gemini:', error);
            return [];
        }

        return [];
    }
}