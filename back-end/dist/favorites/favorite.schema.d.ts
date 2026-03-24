import { Document, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { Item } from '../items/item.schema';
export declare class Favorite extends Document {
    user: User | Types.ObjectId;
    item: Item | Types.ObjectId;
}
export declare const FavoriteSchema: import("mongoose").Schema<Favorite, import("mongoose").Model<Favorite, any, any, any, (Document<unknown, any, Favorite, any, import("mongoose").DefaultSchemaOptions> & Favorite & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Favorite, any, import("mongoose").DefaultSchemaOptions> & Favorite & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}), any, Favorite>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Favorite, Document<unknown, {}, Favorite, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Favorite & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Favorite, Document<unknown, {}, Favorite, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Favorite & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | User, Favorite, Document<unknown, {}, Favorite, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Favorite & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    item?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | Item, Favorite, Document<unknown, {}, Favorite, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Favorite & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Favorite>;
