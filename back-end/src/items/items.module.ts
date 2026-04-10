import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { Item, ItemSchema } from './item.schema';
import { ImageProcessingProcessor } from './image-processing.processor';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  Brand,
  BrandSchema,
  Category,
  CategorySchema,
  Neckline,
  NecklineSchema,
  Occasion,
  OccasionSchema,
  SeasonCode,
  SeasonCodeSchema,
  SleeveLength,
  SleeveLengthSchema,
  Style,
  StyleSchema,
  Size,
  SizeSchema,
  Shoulder,
  ShoulderSchema,
} from './metadata.schema';
import { ChromaModule } from 'src/chroma/chroma.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Neckline.name, schema: NecklineSchema },
      { name: Occasion.name, schema: OccasionSchema },
      { name: SeasonCode.name, schema: SeasonCodeSchema },
      { name: SleeveLength.name, schema: SleeveLengthSchema },
      { name: Style.name, schema: StyleSchema },
      { name: Size.name, schema: SizeSchema },
      { name: Shoulder.name, schema: ShoulderSchema },
    ]),
    BullModule.registerQueue({
      name: 'image-processing',
    }),
    CloudinaryModule,
    ChromaModule,
    EventsModule,
    NotificationsModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService, ImageProcessingProcessor],
  exports: [ItemsService],
})
export class ItemsModule {}
