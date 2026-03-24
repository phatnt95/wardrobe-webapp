import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { Item } from '../items/item.schema';

@Schema({ timestamps: true })
export class Favorite extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: User | Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
    item: Item | Types.ObjectId;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// Make sure that a user can only favorite an item once
FavoriteSchema.index({ user: 1, item: 1 }, { unique: true });
