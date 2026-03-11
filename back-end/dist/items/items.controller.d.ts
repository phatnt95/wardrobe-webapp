import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto } from './dto/items.dto';
export declare class ItemsController {
    private readonly itemsService;
    constructor(itemsService: ItemsService);
    create(createItemDto: CreateItemDto, file: Express.Multer.File, user: any): Promise<import("./item.schema").Item>;
    findAll(user: any): Promise<import("./item.schema").Item[]>;
    findOne(id: string, user: any): Promise<import("./item.schema").Item>;
    update(id: string, updateItemDto: UpdateItemDto, file: Express.Multer.File, user: any): Promise<import("./item.schema").Item>;
    remove(id: string, user: any): Promise<void>;
}
