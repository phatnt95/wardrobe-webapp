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

@Schema({ timestamps: false, _id: false })
export class OutfitItem {
  @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
  item: Types.ObjectId | Item;

  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop({ required: true })
  width: number;

  @Prop({ required: true })
  height: number;

  @Prop({ required: true })
  zIndex: number;
}

export const OutfitItemSchema = SchemaFactory.createForClass(OutfitItem);

@Schema({ timestamps: true })
export class Outfit {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [OutfitItemSchema], default: [] })
  items: OutfitItem[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String, enum: Season, default: Season.All })
  season: Season;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId | string;
}

export const OutfitSchema = SchemaFactory.createForClass(Outfit);
