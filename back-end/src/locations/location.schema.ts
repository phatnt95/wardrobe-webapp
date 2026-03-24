import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/user.schema';

export enum NodeType {
  LOCATION = 'LOCATION',
  HOUSE = 'HOUSE',
  ROOM = 'ROOM',
  CABINET = 'CABINET',
  SHELF = 'SHELF',
  BOX = 'BOX',
  CLOSET = 'CLOSET', // tủ đứng nói chung
  SECTION = 'SECTION', // ngăn tủ
  DRESSER = 'DRESSER', // tủ ngăn kéo
  DRAWER = 'DRAWER', // ngăn kéo
}

@Schema({ timestamps: true })
export class Location extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, enum: NodeType, required: true })
  type: NodeType;

  @Prop({ type: Types.ObjectId, ref: 'Location', default: null })
  parent: Types.ObjectId | null;

  @Prop({ index: true })
  path: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner: User | Types.ObjectId;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
