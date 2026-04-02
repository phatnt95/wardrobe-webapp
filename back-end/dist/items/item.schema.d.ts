import { Document, Types } from 'mongoose';
import { Location } from '../locations/location.schema';
import { User } from '../users/user.schema';
import { Brand, Category, Neckline, Occasion, SeasonCode, SleeveLength, Style, Shoulder, Size } from './metadata.schema';
export declare class Item extends Document {
    name: string;
    description: string;
    price: number;
    owner: User | Types.ObjectId;
    brand: Brand | Types.ObjectId;
    category: Category | Types.ObjectId;
    neckline: Neckline | Types.ObjectId;
    occasion: Occasion | Types.ObjectId;
    seasonCode: SeasonCode | Types.ObjectId;
    sleeveLength: SleeveLength | Types.ObjectId;
    style: Style | Types.ObjectId;
    shoulder: Shoulder | Types.ObjectId;
    color: string;
    size: Size | Types.ObjectId;
    tags: string[];
    images: string[];
    location: Location | Types.ObjectId;
    embedding: number[];
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
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    size?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | Size, Item, Document<unknown, {}, Item, {
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
    brand?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | Brand, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | Category, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    neckline?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | Neckline, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    occasion?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | Occasion, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    seasonCode?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | SeasonCode, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sleeveLength?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | SleeveLength, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    style?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | Style, Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    shoulder?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | Shoulder, Item, Document<unknown, {}, Item, {
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
    embedding?: import("mongoose").SchemaDefinitionProperty<number[], Item, Document<unknown, {}, Item, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Item & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Item>;
