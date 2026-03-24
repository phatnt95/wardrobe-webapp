import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { Item, ItemSchema } from './item.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
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
    CloudinaryModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
