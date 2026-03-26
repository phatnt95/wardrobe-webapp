import { Model } from 'mongoose';
import { Item } from './item.schema';
import { CreateItemDto, UpdateItemDto } from './dto/items.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Brand, Category, Neckline, Occasion, SeasonCode, SleeveLength, Style, Size, Shoulder } from './metadata.schema';
export declare class ItemsService {
    private itemModel;
    private brandModel;
    private categoryModel;
    private necklineModel;
    private occasionModel;
    private seasonCodeModel;
    private sleeveLengthModel;
    private styleModel;
    private sizeModel;
    private shoulderModel;
    private cloudinaryService;
    constructor(itemModel: Model<Item>, brandModel: Model<Brand>, categoryModel: Model<Category>, necklineModel: Model<Neckline>, occasionModel: Model<Occasion>, seasonCodeModel: Model<SeasonCode>, sleeveLengthModel: Model<SleeveLength>, styleModel: Model<Style>, sizeModel: Model<Size>, shoulderModel: Model<Shoulder>, cloudinaryService: CloudinaryService);
    findAllAttributes(): Promise<{
        Brand: (Brand & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Category: (Category & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Neckline: (Neckline & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Occasion: (Occasion & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        SeasonCode: (SeasonCode & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        SleeveLength: (SleeveLength & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Style: (Style & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Size: (Size & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        Shoulder: (Shoulder & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    private getModelByType;
    createAttribute(type: string, name: string): Promise<any>;
    updateAttribute(type: string, id: string, name: string): Promise<any>;
    removeAttribute(type: string, id: string): Promise<any>;
    create(createItemDto: CreateItemDto, file: Express.Multer.File, userId: string): Promise<Item>;
    findAll(userId: string): Promise<Item[]>;
    findOne(id: string, userId: string): Promise<Item>;
    update(id: string, updateItemDto: UpdateItemDto, file: Express.Multer.File, userId: string): Promise<Item>;
    remove(id: string, userId: string): Promise<void>;
}
