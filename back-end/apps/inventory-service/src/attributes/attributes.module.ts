import { Module } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema, Category, CategorySchema, Color, ColorSchema, Neckline, NecklineSchema, Occasion, OccasionSchema, SeasonCode, SeasonCodeSchema, Size, SizeSchema, SleeveLength, SleeveLengthSchema, Style, StyleSchema } from '@app/shared';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Brand.name, schema: BrandSchema},
      {name: Color.name, schema: ColorSchema},
      {name: Size.name, schema: SizeSchema},
      {name: Category.name, schema: CategorySchema},
      {name: Neckline.name, schema: NecklineSchema},
      {name: Occasion.name, schema: OccasionSchema},
      {name: SeasonCode.name, schema: SeasonCodeSchema},
      {name: SleeveLength.name, schema: SleeveLengthSchema},
      {name: Style.name, schema: StyleSchema},
    ])
  ],
  controllers: [AttributesController],
  providers: [AttributesService],
})
export class AttributesModule {}
