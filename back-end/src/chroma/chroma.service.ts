import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';

@Injectable()
export class ChromaService implements OnModuleInit {
  private readonly logger = new Logger(ChromaService.name);
  private client: ChromaClient;
  private collection: Collection;

  // Tên collection cố định cho tủ đồ
  private readonly COLLECTION_NAME = 'wardrobe_items';

  constructor(private readonly configService: ConfigService) {
    const chromaUrl =
      this.configService.get<string>('CHROMADB_URL') || 'http://localhost:8000';
    this.logger.log(`Đang kết nối tới ChromaDB tại: ${chromaUrl}`);
    this.client = new ChromaClient({ path: chromaUrl });
  }

  // Khởi tạo connection và Collection khi NestJS khởi động
  async onModuleInit() {
    try {
      this.logger.log('Đang kết nối tới ChromaDB...');

      // getOrCreateCollection: Nếu chưa có thì tạo mới, có rồi thì lấy ra dùng
      this.collection = await this.client.getOrCreateCollection({
        name: this.COLLECTION_NAME,
        metadata: { 'hnsw:space': 'cosine' }, // Dùng Cosine Similarity để so sánh Vector (chuẩn cho LLM)
        embeddingFunction: {
          generate: async (texts: string[]) => {
            // Hàm giả (dummy). Chúng ta trả về mảng rỗng vì
            // chúng ta luôn truyền trực tiếp mảng Vector từ Gemini vào hàm upsert rồi.
            return [];
          },
        },
      });

      this.logger.log(
        `Kết nối ChromaDB thành công. Collection: ${this.COLLECTION_NAME}`,
      );
    } catch (error) {
      this.logger.error('Lỗi khi khởi tạo ChromaDB:', error);
      throw error;
    }
  }

  // ─── INGESTION PIPELINE (Thêm / Cập nhật Vector) ─────────────────────────

  /**
   * Lưu Vector của một món đồ vào ChromaDB
   * Dùng `upsert` để nếu item chưa có thì thêm, có rồi thì ghi đè vector mới
   */
  async upsertItemVector(
    itemId: string,
    userId: string,
    embedding: number[],
    itemMetadata: Record<string, any>,
  ): Promise<void> {
    try {
      await this.collection.upsert({
        ids: [itemId], // id này chính là _id của MongoDB
        embeddings: [embedding],
        metadatas: [{ ...itemMetadata, userId: String(userId) }], // Gắn userId để sau này lọc theo user
      });
      this.logger.debug(`Đã upsert vector cho Item ID: ${itemId}`);
    } catch (error) {
      this.logger.error(`Lỗi khi upsert vector cho Item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Xóa Vector khi user xóa món đồ khỏi tủ
   */
  async deleteItemVector(itemId: string): Promise<void> {
    try {
      await this.collection.delete({
        ids: [itemId],
      });
      this.logger.debug(`Đã xóa vector của Item ID: ${itemId}`);
    } catch (error) {
      this.logger.error(`Lỗi khi xóa vector cho Item ${itemId}:`, error);
      // Không ném lỗi để tránh crash luồng delete chính bên MongoDB
    }
  }

  // ─── RETRIEVAL PIPELINE (Tìm kiếm Vector) ────────────────────────────────

  /**
   * Tìm Top K món đồ phù hợp nhất dựa trên Vector của ngữ cảnh (thời tiết)
   */
  async querySimilarItems(
    userId: string,
    queryEmbedding: number[],
    limit: number = 15,
  ): Promise<string[]> {
    this.logger.log(`Querying similar items for user ${userId}`);
    try {
      // 1. ÉP KIỂU TUYỆT ĐỐI RA CHUỖI NGUYÊN THỦY (Dọn dẹp Buffer của Mongoose)
      const cleanUserId = userId.toString();
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        // CỰC KỲ QUAN TRỌNG: Chỉ tìm trong tủ đồ của đúng userId này
        where: {
          userId: { $eq: cleanUserId }, // Cú pháp chuẩn nhất của Chroma
        },
      });

      // Chroma trả về dạng mảng 2 chiều: results.ids = [["id1", "id2", ...]]
      if (results.ids && results.ids.length > 0) {
        return results.ids[0];
      }

      return [];
    } catch (error) {
      this.logger.error(`Lỗi khi query Vector cho User ${userId}:`, error);
      return [];
    }
  }
}
