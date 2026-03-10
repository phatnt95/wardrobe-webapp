import { NestFactory } from '@nestjs/core';
import { CloudinaryModule } from './cloudinary.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(CloudinaryModule);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('CLOUDINARY_PORT') || 3003;

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Cloudinary Media Service')
    .setDescription('Tài liệu API hệ thống lưu trữ ảnh Wardrobe')
    .setVersion('1.0')
    // .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger tại route /api
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Giữ lại token sau khi F5 trang
    },
  });

  // --- LOGIC XUẤT FILE SWAGGER.JSON ---
  // File sẽ được lưu tại thư mục root của dự án hoặc thư mục dist
  const outputPath = join(process.cwd(), 'services/cloudinary-service.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`\n✅ Exported swagger: ${outputPath}\n`);
  // ------------------------------------

  await app.listen(port);

  console.log(`\n✅ Cloudinary service is listening on port ${port}\n`);
  console.log(`\n✅ Swagger đang chạy tại: http://localhost:${port}/api\n`);
}
void bootstrap();
 