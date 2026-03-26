import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Item } from '../items/item.schema';

export enum Season {
  Spring = 'Spring',
  Summer = 'Summer',
  Autumn = 'Autumn',
  Winter = 'Winter',
  All = 'All',
}

export type OutfitDocument = HydratedDocument<Outfit>;

@Schema({ timestamps: true })
export class Outfit {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Item' }] })
  items: Item[] | Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String, enum: Season, default: Season.All })
  season: Season;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId | string;
}

export const OutfitSchema = SchemaFactory.createForClass(Outfit);
