import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class UserLicense extends Document {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @ApiProperty({ enum: ['free', 'pro', 'premium'] })
  @Prop({ required: true, enum: ['free', 'pro', 'premium'], default: 'free' })
  plan: 'free' | 'pro' | 'premium';

  @ApiProperty({ enum: ['active', 'expired', 'cancelled'] })
  @Prop({
    required: true,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  })
  status: 'active' | 'expired' | 'cancelled';

  @ApiProperty()
  @Prop({ required: true })
  startedAt: Date;

  @ApiProperty({ nullable: true })
  @Prop({ type: Date, default: null })
  expiresAt: Date | null;
}

export const UserLicenseSchema = SchemaFactory.createForClass(UserLicense);
