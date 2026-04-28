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

// Tạo sub-schema cho Ảnh
@Schema({ _id: false }) // Tắt tính năng tự sinh _id cho sub-document
export class ImageAsset {
  @Prop({ default: '' })
  publicId: string;

  @Prop({ required: true })
  imageUrl: string;
}

const ImageAssetSchema = SchemaFactory.createForClass(ImageAsset);

@Schema({ timestamps: true })
export class Item extends Document {
  @Prop({ default: 'Untitled', trim: true })
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

  // Cập nhật lại field image
  @Prop({ type: [ImageAssetSchema], default: [] })
  imageAssets: ImageAsset[];

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  location: Location | Types.ObjectId;

  // Thêm field này để lưu Vector do Gemini sinh ra
  // Lưu ý: Đặt default là mảng rỗng hoặc undefined để không ảnh hưởng data cũ
  @Prop({ type: [Number], select: false })
  embedding: number[];

  @Prop({
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'completed',
  })
  status: string;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
