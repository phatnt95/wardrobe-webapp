import { NestFactory } from '@nestjs/core';
import { InventoryServiceModule } from './inventory-service.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  // 1. Tạo instance cho HTTP App (Expose API)
  const app = await NestFactory.create(InventoryServiceModule);
  const configService = app.get(ConfigService);

  const rabbitMQUrls = configService.get<string>('RMQ_URL');
  console.log('rabbitMQUrls: ', rabbitMQUrls);

  // 2. Cấu hình Hybrid Microservice (Lắng nghe RabbitMQ)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RMQ_URL') || 'amqp://localhost:5672'],
      queue: configService.get<string>('RMQ_INVENTORY_QUEUE') || 'inventory_queue',
      queueOptions: {
        durable: false,
      },
    },
  });
  app.setGlobalPrefix('api'); // set prefix api.

  // 3. Middlewares cho HTTP API
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // 4. Khởi chạy Microservice (RabbitMQ)
  await app.startAllMicroservices();

  // 5. Khởi chạy HTTP Server (Cổng 3002)
  const port = configService.get<number>('INVENTORY_PORT') || 3002;
  
  // Swagger configuration
  const config = new DocumentBuilder()
  .setTitle('Wardrobe Inventory API')
  .setDescription('Hệ thống quản lý tủ đồ đa địa điểm (HN, HCM, DN)')
  .setVersion('1.0')
  .addBearerAuth() // Hỗ trợ JWT Token để test API
  .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup('docs', app, document);
  
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));
  
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Inventory API is running on: http://localhost:${port}`);
  console.log(`📨 Inventory Microservice is listening to RabbitMQ...`);
}
bootstrap();
