import { Module } from '@nestjs/common';
import { StoragesService } from './storages.service';
import { StoragesController } from './storages.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageNode, StorageNodeSchema } from '@app/shared';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StorageNode.name, schema: StorageNodeSchema }]),
  ],
  controllers: [StoragesController],
  providers: [StoragesService],
  exports: [StoragesService],
})
export class StoragesModule {}
