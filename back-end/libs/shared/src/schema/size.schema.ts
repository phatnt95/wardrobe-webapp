import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Size extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  measurement: string;
}

export const SizeSchema = SchemaFactory.createForClass(Size);