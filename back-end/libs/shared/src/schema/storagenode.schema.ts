// NodeType schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export enum NodeType {
  LOCATION = 'LOCATION', // HN, HCM, DN
  HOUSE = 'HOUSE',
  ROOM = 'ROOM',
  CABINET = 'CABINET', // Tủ
  SHELF = 'SHELF',     // Ngăn tủ
  BOX = 'BOX'
}

@Schema({ timestamps: true })
export class StorageNode extends Document {
//   @ApiProperty({ example: 'Ngăn kéo số 1', description: 'Tên vị trí' })
  @Prop({ required: true, trim: true })
  name: string;

//   @ApiProperty({ enum: NodeType, example: 'SHELF' })
  @Prop({ type: String, enum: NodeType, required: true })
  type: NodeType;

//   @ApiProperty({ type: String, description: 'ID của nút cha' })
  @Prop({ type: Types.ObjectId, ref: 'StorageNode', default: null })
  parent: Types.ObjectId | null;

//   @ApiProperty({ description: 'Đường dẫn phân cấp để query nhanh', example: '/HN/House1/Room101/' })
  @Prop({ index: true })
  path: string; // Ví dụ: ",ID_HN,ID_House,ID_Room,"

  @Prop({ type: Types.ObjectId, ref: 'Owner', required: true })
  owner: Types.ObjectId;
}

export const StorageNodeSchema = SchemaFactory.createForClass(StorageNode);