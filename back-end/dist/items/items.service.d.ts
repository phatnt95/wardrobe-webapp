import { Model } from 'mongoose';
import { Item } from './item.schema';
import { CreateItemDto, UpdateItemDto } from './dto/items.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class ItemsService {
    private itemModel;
    private cloudinaryService;
    constructor(itemModel: Model<Item>, cloudinaryService: CloudinaryService);
    create(createItemDto: CreateItemDto, file: Express.Multer.File, userId: string): Promise<Item>;
    findAll(userId: string): Promise<Item[]>;
    findOne(id: string, userId: string): Promise<Item>;
    update(id: string, updateItemDto: UpdateItemDto, file: Express.Multer.File, userId: string): Promise<Item>;
    remove(id: string, userId: string): Promise<void>;
}
