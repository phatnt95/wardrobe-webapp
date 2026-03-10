import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { InventoryServiceModule } from '../inventory-service.module';
import { Owner, StorageNode } from '@app/shared';
import { LOCATION_MASTER_DATA } from '@app/shared/constants/constants';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(InventoryServiceModule);
  const storageNodeModel = app.get<Model<StorageNode>>(getModelToken(StorageNode.name));
  const ownerModel = app.get<Model<Owner>>(getModelToken(Owner.name));

  console.log('🌱 Starting Location Seeding...');

  // 1. Lấy một Owner ID hợp lệ (vì mọi StorageNode cần Owner)
  const defaultOwner = await ownerModel.findOne();
  if (!defaultOwner) {
    console.error('❌ Cần tạo Account/Owner trước khi chạy seed vị trí!');
    return await app.close();
  }

  // 2. Hàm đệ quy để tạo các Node
  const seedNodes = async (nodes: any[], parentId: string | null = null, parentPath: string = '') => {
    for (const node of nodes) {
      const newNode = await storageNodeModel.create({
        name: node.name,
        type: node.type,
        parent: parentId,
        owner: defaultOwner._id,
        path: `${parentPath}/${node.name}`
      });

      console.log(`✅ Created: ${newNode.path}`);

      if (node.children && node.children.length > 0) {
        await seedNodes(node.children, newNode._id as unknown as string, newNode.path);
      }
    }
  };

  try {
    await storageNodeModel.deleteMany({}); // Reset dữ liệu cũ
    await seedNodes(LOCATION_MASTER_DATA);
    console.log('🚀 Location Seeding Completed!');
  } catch (error) {
    console.error('❌ Error Seeding:', error);
  } finally {
    await app.close();
  }
}

bootstrap();