import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto } from './dto/items.dto';
export declare class ItemsController {
    private readonly itemsService;
    constructor(itemsService: ItemsService);
    create(createItemDto: CreateItemDto, file: Express.Multer.File, user: any): Promise<import("./item.schema").Item>;
    exportTemplate(res: any): Promise<void>;
    importItems(file: Express.Multer.File, user: any): Promise<any>;
    findAll(user: any): Promise<import("./item.schema").Item[]>;
    findAllAttributes(): Promise<{
        Brand: (import("./metadata.schema").Brand & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Category: (import("./metadata.schema").Category & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Neckline: (import("./metadata.schema").Neckline & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Occasion: (import("./metadata.schema").Occasion & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        SeasonCode: (import("./metadata.schema").SeasonCode & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        SleeveLength: (import("./metadata.schema").SleeveLength & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Style: (import("./metadata.schema").Style & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Size: (import("./metadata.schema").Size & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Shoulder: (import("./metadata.schema").Shoulder & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    createAttribute(type: string, body: {
        name: string;
    }): Promise<any>;
    updateAttribute(type: string, id: string, body: {
        name: string;
    }): Promise<any>;
    removeAttribute(type: string, id: string): Promise<any>;
    findOne(id: string, user: any): Promise<import("./item.schema").Item>;
    update(id: string, updateItemDto: UpdateItemDto, file: Express.Multer.File, user: any): Promise<import("./item.schema").Item>;
    remove(id: string, user: any): Promise<void>;
}
