import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Location } from '../locations/location.schema';
import { User } from '../users/user.schema';
import {
  Brand,
  Category,
  Neckline,
  Occasion,
  SeasonCode,
  SleeveLength,
  Style,
  Shoulder,
  Size,
} from './metadata.schema';

@Schema({ timestamps: true })
export class Item extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: User | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand', default: null })
  brand: Brand | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  category: Category | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Neckline', default: null })
  neckline: Neckline | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Occasion', default: null })
  occasion: Occasion | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SeasonCode', default: null })
  seasonCode: SeasonCode | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SleeveLength', default: null })
  sleeveLength: SleeveLength | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Style', default: null })
  style: Style | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Shoulder', default: null })
  shoulder: Shoulder | Types.ObjectId;

  @Prop({ type: String, default: null })
  color: string;

  @Prop({ type: Types.ObjectId, ref: 'Size', default: null })
  size: Size | Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  location: Location | Types.ObjectId;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
