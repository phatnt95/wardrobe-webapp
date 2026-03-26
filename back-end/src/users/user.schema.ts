import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class BodyMeasurements {
  @Prop() height?: number;
  @Prop() weight?: number;
  @Prop() chest?: number;
  @Prop() waist?: number;
  @Prop() hips?: number;
}

@Schema({ _id: false })
export class StylePreferences {
  @Prop({ type: [String], default: [] }) favoriteStyles: string[];
  @Prop({ type: [String], default: [] }) colorPalette: string[];
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  phone?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  bio?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ type: BodyMeasurements, default: {} })
  measurements?: BodyMeasurements;

  @Prop({ type: StylePreferences, default: { favoriteStyles: [], colorPalette: [] } })
  stylePreferences?: StylePreferences;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
