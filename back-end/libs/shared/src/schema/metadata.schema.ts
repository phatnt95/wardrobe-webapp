import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Base class để tái sử dụng logic cho các danh mục chỉ có trường Name
@Schema()
export class BaseMetadata extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;
}

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
export class Style extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop()
  description: string;
}
export const StyleSchema = SchemaFactory.createForClass(Style);

@Schema({ timestamps: true })
export class Shoulder extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop()
  description: string;
}
export const ShoulderSchema = SchemaFactory.createForClass(Shoulder);