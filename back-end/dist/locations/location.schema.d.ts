import { Document, Types } from 'mongoose';
import { User } from '../users/user.schema';
export declare enum NodeType {
    LOCATION = "LOCATION",
    HOUSE = "HOUSE",
    ROOM = "ROOM",
    CABINET = "CABINET",
    SHELF = "SHELF",
    BOX = "BOX"
}
export declare class Location extends Document {
    name: string;
    type: NodeType;
    parent: Types.ObjectId | null;
    path: string;
    owner: User | Types.ObjectId;
}
export declare const LocationSchema: import("mongoose").Schema<Location, import("mongoose").Model<Location, any, any, any, (Document<unknown, any, Location, any, import("mongoose").DefaultSchemaOptions> & Location & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Location, any, import("mongoose").DefaultSchemaOptions> & Location & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}), any, Location>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Location, Document<unknown, {}, Location, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Location & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Location, Document<unknown, {}, Location, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Location & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Location, Document<unknown, {}, Location, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Location & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<NodeType, Location, Document<unknown, {}, Location, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Location & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    path?: import("mongoose").SchemaDefinitionProperty<string, Location, Document<unknown, {}, Location, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Location & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    parent?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | null, Location, Document<unknown, {}, Location, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Location & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    owner?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | User, Location, Document<unknown, {}, Location, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Location & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Location>;
