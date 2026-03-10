import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { InventoryServiceModule } from '../inventory-service.module';
import { MASTER_DATA } from '@app/shared/constants/constants';
import { 
  Category, Neckline, Occasion, SeasonCode, Style 
} from '@app/shared/schema/metadata.schema';
import { Color, Size, Brand } from '@app/shared';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(InventoryServiceModule);
  console.log('🌱 Starting Seeding Master Data...');

  const seedData = async (modelToken: string, data: any[]) => {
    const model = app.get<Model<any>>(getModelToken(modelToken));
    await model.deleteMany({}); // Xóa dữ liệu cũ để tránh trùng lặp
    await model.insertMany(data);
    console.log(`✅ Seeded ${data.length} records for ${modelToken}`);
  };

  try {
    await seedData(Brand.name, MASTER_DATA.BRANDS);
    await seedData(Category.name, MASTER_DATA.CATEGORIES);
    await seedData(Color.name, MASTER_DATA.COLORS);
    await seedData(Size.name, MASTER_DATA.SIZES);
    await seedData(Neckline.name, MASTER_DATA.NECKLINES);
    await seedData(Occasion.name, MASTER_DATA.OCCASIONS);
    await seedData(SeasonCode.name, MASTER_DATA.SEASONS);
    await seedData(Style.name, MASTER_DATA.STYLES);

    console.log('🚀 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();