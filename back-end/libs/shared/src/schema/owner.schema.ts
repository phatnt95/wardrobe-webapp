import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true }) 
export class Owner extends Document{
    @Prop({ type: Types.ObjectId, required: true, unique: true })
    authId: Types.ObjectId; // ID từ Auth Service

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ })
    firstName: string;
}

export const OwnerSchema = SchemaFactory.createForClass(Owner);
