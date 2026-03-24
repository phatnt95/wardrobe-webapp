import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Location } from '../locations/location.schema';
import { User } from '../users/user.schema';

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

  @Prop({ type: String, default: null })
  brand: string;

  @Prop({ type: String, default: null })
  category: string;

  @Prop({ type: String, default: null })
  color: string;

  @Prop({ type: String, default: null })
  size: string;

  @Prop({ type: String, default: null })
  style: string;

  @Prop({ type: String, default: null })
  season: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  location: Location | Types.ObjectId;
}

export const ItemSchema = SchemaFactory.createForClass(Item);