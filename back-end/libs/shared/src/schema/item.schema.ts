import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { 
  Brand, Category, Color, Size, Style, Neckline, 
  SleeveLength, Shoulder, Occasion, SeasonCode, Owner
} from '@app/shared'; // Import từ index của shared lib
import { StorageNode } from './storagenode.schema';

// @Schema()
// class ProductImage {
//   @Prop()
//   path: string;

//   @Prop()
//   alt: string;

//   @Prop({ default: false })
//   isMain: boolean;
// }

@Schema({ timestamps: true })
export class Item extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Number })
  price: number;

  // --- QUAN TRỌNG: Liên kết với Owner trong Inventory DB ---
  @Prop({ type: Types.ObjectId, ref: 'Owner', required: true })
  owner: Owner | Types.ObjectId;

  // --- CÁC THAM CHIẾU METADATA ---
  @Prop({ type: Types.ObjectId, ref: 'Brand', default: null })
  brand: Brand | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  category: Category | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Color', default: null })
  color: Color | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Size', default: null })
  size: Size | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Style', default: null })
  style: Style | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Neckline', default: null })
  neckline: Neckline | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SleeveLength', default: null })
  sleeveLength: SleeveLength | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Shoulder', default: null })
  shoulder: Shoulder | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Occasion', default: null })
  occasion: Occasion | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SeasonCode', default: null })
  seasonCode: SeasonCode | Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  images: String[];

  // Liên kết vị trí lưu trữ (StorageNode)
  @Prop({ type: Types.ObjectId, ref: 'StorageNode', required: true })
  storage: StorageNode | Types.ObjectId;
}

export const ItemSchema = SchemaFactory.createForClass(Item);