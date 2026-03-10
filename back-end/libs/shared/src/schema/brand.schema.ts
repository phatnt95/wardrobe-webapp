import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Brand extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop()
  country: string;

  @Prop()
  founded: number;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);