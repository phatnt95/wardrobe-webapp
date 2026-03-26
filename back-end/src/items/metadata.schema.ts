import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Base class để tái sử dụng logic cho các danh mục chỉ có trường Name
@Schema()
export class BaseMetadata extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;
  @Prop()
  description: string;
}

@Schema({ timestamps: true })
export class Brand extends BaseMetadata {}
export const BrandSchema = SchemaFactory.createForClass(Brand);

@Schema({ timestamps: true })
export class Category extends BaseMetadata {}
export const CategorySchema = SchemaFactory.createForClass(Category);

@Schema({ timestamps: true })
export class Neckline extends BaseMetadata {}
export const NecklineSchema = SchemaFactory.createForClass(Neckline);

@Schema({ timestamps: true })
export class Occasion extends BaseMetadata {}
export const OccasionSchema = SchemaFactory.createForClass(Occasion);

@Schema({ timestamps: true })
export class SeasonCode extends BaseMetadata {}
export const SeasonCodeSchema = SchemaFactory.createForClass(SeasonCode);

@Schema({ timestamps: true })
export class SleeveLength extends BaseMetadata {}
export const SleeveLengthSchema = SchemaFactory.createForClass(SleeveLength);

@Schema({ timestamps: true })
export class Style extends BaseMetadata {}
export const StyleSchema = SchemaFactory.createForClass(Style);

@Schema({ timestamps: true })
export class Size extends BaseMetadata {}
export const SizeSchema = SchemaFactory.createForClass(Size);

@Schema({ timestamps: true })
export class Shoulder extends BaseMetadata {}
export const ShoulderSchema = SchemaFactory.createForClass(Shoulder);
