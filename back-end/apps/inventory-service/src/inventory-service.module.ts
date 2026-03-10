import { Module } from '@nestjs/common';
import { InventoryServiceController } from './inventory-service.controller';
import { InventoryServiceService } from './inventory-service.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonConfigModule, User, UserSchema } from '@app/shared';
import { ConfigService } from '@nestjs/config';
import { OwnerModule } from './owner/owner.module';
import { ItemsModule } from './items/items.module';
import { AttributesModule } from './attributes/attributes.module';
import { StoragesModule } from './storages/storages.module';
import { OwnerService } from './owner/owner.service';

@Module({
  imports: [
    CommonConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_INVENTORY_URI'),
      }),
    }),
    // MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://inventory-db:27017/wardrobe_inventory'),
    // MongooseModule.forFeature([{ name: User.name, schema: UserSchema },]),
    OwnerModule,
    ItemsModule,
    AttributesModule,
    StoragesModule,
  ],
  controllers: [InventoryServiceController],
  providers: [InventoryServiceService],
})
export class InventoryServiceModule { }
