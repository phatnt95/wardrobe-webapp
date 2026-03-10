import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthServiceModule } from './auth-service.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule);
  
  // await app.listen(process.env.port ?? 3000);
  // 1. Lấy ConfigService
  const configService = app.get(ConfigService);
  
  // 2. Đọc Port từ .env (Nếu không có thì mặc định 3001)
  const port = configService.get<number>('AUTH_PORT') || 3001;

  // 3. Cấu hình Validation & CORS (Rất quan trọng khi chạy local)
  // Kích hoạt validation cho toàn bộ ứng dụng
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Tự động loại bỏ các field không được định nghĩa trong DTO
    forbidNonWhitelisted: true,
    transform: true, // Tự động convert dữ liệu về đúng kiểu của class DTO
  }));
  app.enableCors();

  // 4. Lắng nghe trên port đã cấu hình
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Auth Service is running on: http://localhost:${port}`);
  
}
bootstrap();
