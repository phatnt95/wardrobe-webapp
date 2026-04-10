import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/user.schema';

export enum NotificationType {
  ITEM_PROCESSED = 'ITEM_PROCESSED',
  ITEM_FAILED = 'ITEM_FAILED',
  INFO = 'INFO',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User | Types.ObjectId;

  @Prop({ required: true, enum: NotificationType })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ required: false })
  linkTarget: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
