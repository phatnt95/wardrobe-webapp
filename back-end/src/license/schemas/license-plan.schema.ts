import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class LicenseLimits {
  @Prop({ required: true })
  maxItems: number; // -1 = unlimited

  @Prop({ required: true })
  maxOutfits: number; // -1 = unlimited

  @Prop({ required: true })
  aiFeatures: boolean;

  @Prop({ required: true })
  importExport: boolean;

  @Prop({ required: true })
  analytics: boolean;
}

@Schema({ timestamps: true })
export class LicensePlan extends Document {
  @ApiProperty({ enum: ['free', 'pro', 'premium'] })
  @Prop({ required: true, enum: ['free', 'pro', 'premium'], unique: true })
  name: 'free' | 'pro' | 'premium';

  @ApiProperty()
  @Prop({ required: true })
  displayName: string;

  @ApiProperty()
  @Prop({ required: true, default: 0 })
  price: number;

  @ApiProperty()
  @Prop({ type: LicenseLimits, required: true })
  limits: LicenseLimits;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;
}

export const LicensePlanSchema = SchemaFactory.createForClass(LicensePlan);
