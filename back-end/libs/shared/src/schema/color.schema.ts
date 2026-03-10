import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
class RGB {
  @Prop() r: number;
  @Prop() g: number;
  @Prop() b: number;
}

@Schema({ timestamps: true })
export class Color extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  hexCode: string;

  @Prop({ type: RGB })
  rgb: RGB;
}

export const ColorSchema = SchemaFactory.createForClass(Color);