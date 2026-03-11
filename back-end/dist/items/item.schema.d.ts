import { Document, Types } from 'mongoose';
import { Location } from '../locations/location.schema';
import { User } from '../users/user.schema';
export declare class Item extends Document {
    name: string;
    description: string;
    price: number;
    owner: User | Types.ObjectId;
    brand: string;
    category: string;
    color: string;
    size: string;
    style: string;
    season: string;
    tags: string[];
    images: string[];
    location: Location | Types.ObjectId;
}
export declare const ItemSchema: import("mongoose").Schema<Item, import("mongoose").Model<Item, any, any, any, (Document<unknown, any, Item, any, import("mongoose").DefaultSchemaOptions> & Item & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Item, any, import("mongoose").DefaultSchemaOptions> & Item & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}), any, Item>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Item, Document<unknown, {}, Item, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    size?: import("mongoose").SchemaDefinitionProperty<string, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    tags?: import("mongoose").SchemaDefinitionProperty<string[], Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    owner?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | User, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    price?: import("mongoose").SchemaDefinitionProperty<number, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    brand?: import("mongoose").SchemaDefinitionProperty<string, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<string, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    color?: import("mongoose").SchemaDefinitionProperty<string, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    style?: import("mongoose").SchemaDefinitionProperty<string, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    season?: import("mongoose").SchemaDefinitionProperty<string, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    images?: import("mongoose").SchemaDefinitionProperty<string[], Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | Location, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Item>;
