"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const item_schema_1 = require("./item.schema");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let ItemsService = class ItemsService {
    itemModel;
    cloudinaryService;
    constructor(itemModel, cloudinaryService) {
        this.itemModel = itemModel;
        this.cloudinaryService = cloudinaryService;
    }
    async create(createItemDto, file, userId) {
        const images = [];
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
    async findAll(userId) {
        return this.itemModel.find({ owner: userId }).populate('location').exec();
    }
    async findOne(id, userId) {
        const item = await this.itemModel.findOne({ _id: id, owner: userId }).populate('location').exec();
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        return item;
    }
    async update(id, updateItemDto, file, userId) {
        const updateData = { ...updateItemDto };
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            const item = await this.itemModel.findOne({ _id: id, owner: userId });
            if (item) {
                updateData.images = [...item.images, uploadResult.secure_url];
            }
        }
        const item = await this.itemModel.findOneAndUpdate({ _id: id, owner: userId }, updateData, { new: true }).populate('location');
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        return item;
    }
    async remove(id, userId) {
        const result = await this.itemModel.deleteOne({ _id: id, owner: userId }).exec();
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('Item not found');
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(item_schema_1.Item.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        cloudinary_service_1.CloudinaryService])
], ItemsService);
//# sourceMappingURL=items.service.js.map