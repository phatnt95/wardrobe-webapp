import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item } from './item.schema';
import { CreateItemDto, UpdateItemDto } from './dto/items.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ItemsService {
    constructor(
        @InjectModel(Item.name) private itemModel: Model<Item>,
        private cloudinaryService: CloudinaryService,
    ) { }

    async create(createItemDto: CreateItemDto, file: Express.Multer.File, userId: string): Promise<Item> {
        const images: string[] = [];
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            images.push(uploadResult.secure_url);
        }

        const newItem = new this.itemModel({
            ...createItemDto,
            images,
            owner: userId,
        });
        return newItem.save();
    }

    async findAll(userId: string): Promise<Item[]> {
        return this.itemModel.find({ owner: userId }).populate('location').exec();
    }

    async findOne(id: string, userId: string): Promise<Item> {
        const item = await this.itemModel.findOne({ _id: id, owner: userId }).populate('location').exec();
        if (!item) throw new NotFoundException('Item not found');
        return item;
    }

    async update(id: string, updateItemDto: UpdateItemDto, file: Express.Multer.File, userId: string): Promise<Item> {
        const updateData: any = { ...updateItemDto };

        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            const item = await this.itemModel.findOne({ _id: id, owner: userId });
            if (item) {
                updateData.images = [...item.images, uploadResult.secure_url];
            }
        }

        const item = await this.itemModel.findOneAndUpdate(
            { _id: id, owner: userId },
            updateData,
            { new: true }
        ).populate('location');

        if (!item) throw new NotFoundException('Item not found');
        return item;
    }

    async remove(id: string, userId: string): Promise<void> {
        const result = await this.itemModel.deleteOne({ _id: id, owner: userId }).exec();
        if (result.deletedCount === 0) throw new NotFoundException('Item not found');
    }
}
