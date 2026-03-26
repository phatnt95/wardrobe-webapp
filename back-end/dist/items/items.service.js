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
const metadata_schema_1 = require("./metadata.schema");
let ItemsService = class ItemsService {
    itemModel;
    brandModel;
    categoryModel;
    necklineModel;
    occasionModel;
    seasonCodeModel;
    sleeveLengthModel;
    styleModel;
    sizeModel;
    shoulderModel;
    cloudinaryService;
    constructor(itemModel, brandModel, categoryModel, necklineModel, occasionModel, seasonCodeModel, sleeveLengthModel, styleModel, sizeModel, shoulderModel, cloudinaryService) {
        this.itemModel = itemModel;
        this.brandModel = brandModel;
        this.categoryModel = categoryModel;
        this.necklineModel = necklineModel;
        this.occasionModel = occasionModel;
        this.seasonCodeModel = seasonCodeModel;
        this.sleeveLengthModel = sleeveLengthModel;
        this.styleModel = styleModel;
        this.sizeModel = sizeModel;
        this.shoulderModel = shoulderModel;
        this.cloudinaryService = cloudinaryService;
    }
    async findAllAttributes() {
        const [brands, categories, necklines, occasions, seasonCodes, sleeveLengths, styles, sizes, shoulders,] = await Promise.all([
            this.brandModel.find().lean().exec(),
            this.categoryModel.find().lean().exec(),
            this.necklineModel.find().lean().exec(),
            this.occasionModel.find().lean().exec(),
            this.seasonCodeModel.find().lean().exec(),
            this.sleeveLengthModel.find().lean().exec(),
            this.styleModel.find().lean().exec(),
            this.sizeModel.find().lean().exec(),
            this.shoulderModel.find().lean().exec(),
        ]);
        return {
            Brand: brands,
            Category: categories,
            Neckline: necklines,
            Occasion: occasions,
            SeasonCode: seasonCodes,
            SleeveLength: sleeveLengths,
            Style: styles,
            Size: sizes,
            Shoulder: shoulders,
        };
    }
    getModelByType(type) {
        switch (type) {
            case 'Brand': return this.brandModel;
            case 'Category': return this.categoryModel;
            case 'Neckline': return this.necklineModel;
            case 'Occasion': return this.occasionModel;
            case 'SeasonCode': return this.seasonCodeModel;
            case 'SleeveLength': return this.sleeveLengthModel;
            case 'Style': return this.styleModel;
            case 'Size': return this.sizeModel;
            case 'Shoulder': return this.shoulderModel;
            default: throw new common_1.NotFoundException('Invalid attribute type');
        }
    }
    async createAttribute(type, name) {
        const model = this.getModelByType(type);
        return new model({ name }).save();
    }
    async updateAttribute(type, id, name) {
        const model = this.getModelByType(type);
        return model.findByIdAndUpdate(id, { name }, { new: true });
    }
    async removeAttribute(type, id) {
        const model = this.getModelByType(type);
        return model.findByIdAndDelete(id);
    }
    async create(createItemDto, file, userId) {
        const images = [];
        console.log(file);
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            images.push(uploadResult.secure_url);
        }
        const itemData = { ...createItemDto };
        const objectIdFields = [
            'brand',
            'category',
            'neckline',
            'occasion',
            'seasonCode',
            'sleeveLength',
            'style',
            'shoulder',
            'size',
        ];
        objectIdFields.forEach((field) => {
            if (!itemData[field] ||
                itemData[field] === 'undefined' ||
                itemData[field] === 'null') {
                itemData[field] = null;
            }
        });
        const newItem = new this.itemModel({
            ...itemData,
            images,
            owner: userId,
        });
        return newItem.save();
    }
    async findAll(userId) {
        return this.itemModel
            .find({ owner: userId })
            .populate('category location')
            .exec();
    }
    async findOne(id, userId) {
        const item = await this.itemModel
            .findOne({ _id: id, owner: userId })
            .populate('location')
            .exec();
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
        const item = await this.itemModel
            .findOneAndUpdate({ _id: id, owner: userId }, updateData, { new: true })
            .populate('location');
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        return item;
    }
    async remove(id, userId) {
        const result = await this.itemModel
            .deleteOne({ _id: id, owner: userId })
            .exec();
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('Item not found');
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(item_schema_1.Item.name)),
    __param(1, (0, mongoose_1.InjectModel)(metadata_schema_1.Brand.name)),
    __param(2, (0, mongoose_1.InjectModel)(metadata_schema_1.Category.name)),
    __param(3, (0, mongoose_1.InjectModel)(metadata_schema_1.Neckline.name)),
    __param(4, (0, mongoose_1.InjectModel)(metadata_schema_1.Occasion.name)),
    __param(5, (0, mongoose_1.InjectModel)(metadata_schema_1.SeasonCode.name)),
    __param(6, (0, mongoose_1.InjectModel)(metadata_schema_1.SleeveLength.name)),
    __param(7, (0, mongoose_1.InjectModel)(metadata_schema_1.Style.name)),
    __param(8, (0, mongoose_1.InjectModel)(metadata_schema_1.Size.name)),
    __param(9, (0, mongoose_1.InjectModel)(metadata_schema_1.Shoulder.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        cloudinary_service_1.CloudinaryService])
], ItemsService);
//# sourceMappingURL=items.service.js.map