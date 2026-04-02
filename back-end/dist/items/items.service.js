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
var ItemsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const item_schema_1 = require("./item.schema");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const metadata_schema_1 = require("./metadata.schema");
const gemini_service_1 = require("../chroma/gemini.service");
const chroma_service_1 = require("../chroma/chroma.service");
let ItemsService = ItemsService_1 = class ItemsService {
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
    geminiService;
    chromaService;
    logger = new common_1.Logger(ItemsService_1.name);
    constructor(itemModel, brandModel, categoryModel, necklineModel, occasionModel, seasonCodeModel, sleeveLengthModel, styleModel, sizeModel, shoulderModel, cloudinaryService, geminiService, chromaService) {
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
        this.geminiService = geminiService;
        this.chromaService = chromaService;
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
        const savedItem = await newItem.save();
        try {
            await savedItem.populate([
                { path: 'category', select: 'name' },
                { path: 'brand', select: 'name' },
                { path: 'style', select: 'name' },
                { path: 'occasion', select: 'name' },
                { path: 'seasonCode', select: 'name' },
                { path: 'neckline', select: 'name' },
                { path: 'sleeveLength', select: 'name' }
            ]);
            const rawText = this.buildItemDescription(savedItem);
            this.logger.log(`Raw text: ${rawText}`);
            const embedding = await this.geminiService.generateEmbedding(rawText);
            this.logger.log(`Generated embedding for item ${savedItem._id}`);
            this.logger.log(`Embedding: ${embedding}`);
            await this.chromaService.upsertItemVector(savedItem._id.toString(), userId, embedding, {
                categoryId: savedItem.category?._id?.toString() || '',
                color: savedItem.color || '',
                seasonId: savedItem.seasonCode?._id?.toString() || '',
                occasionId: savedItem.occasion?._id?.toString() || ''
            });
        }
        catch (error) {
            this.logger.error(`Failed to sync item ${savedItem._id} to vector DB`, error);
        }
        return savedItem;
    }
    async exportTemplate() {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Wardrobe Items');
        worksheet.columns = [
            { header: 'Name*', key: 'name', width: 30 },
            { header: 'Description', key: 'desc', width: 40 },
            { header: 'Price', key: 'price', width: 15 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Color', key: 'color', width: 15 },
        ];
        worksheet.addRow(['Sample Blue Denim', 'A lightweight denim jacket', 49.99, 'Levi', 'Jacket', 'Blue']);
        worksheet.addRow(['Basic White Tee', 'Cotton t-shirt', 15.00, 'Uniqlo', 'Top', 'White']);
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async importData(file, userId) {
        if (!file)
            throw new common_1.NotFoundException('No file provided');
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet(1);
        const records = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                records.push({
                    name: row.getCell(1).value?.toString() || '',
                    description: row.getCell(2).value?.toString() || '',
                    price: parseFloat(row.getCell(3).value) || 0,
                    brandName: row.getCell(4).value?.toString() || '',
                    catName: row.getCell(5).value?.toString() || '',
                    color: row.getCell(6).value?.toString() || ''
                });
            }
        });
        let imported = 0;
        let failed = 0;
        const errors = [];
        for (const [index, record] of records.entries()) {
            try {
                if (!record.name)
                    throw new Error("Name is required");
                let brandId = null;
                if (record.brandName) {
                    let brand = await this.brandModel.findOne({ name: new RegExp(`^${record.brandName}$`, 'i') });
                    if (!brand)
                        brand = await new this.brandModel({ name: record.brandName }).save();
                    brandId = brand._id;
                }
                let catId = null;
                if (record.catName) {
                    let cat = await this.categoryModel.findOne({ name: new RegExp(`^${record.catName}$`, 'i') });
                    if (!cat)
                        cat = await new this.categoryModel({ name: record.catName }).save();
                    catId = cat._id;
                }
                const itemData = {
                    name: record.name,
                    description: record.description,
                    price: record.price,
                    color: record.color,
                    brand: brandId,
                    category: catId,
                    owner: userId,
                    images: []
                };
                if (!itemData.brand)
                    delete itemData.brand;
                if (!itemData.category)
                    delete itemData.category;
                await new this.itemModel(itemData).save();
                imported++;
            }
            catch (e) {
                failed++;
                errors.push(`Row ${index + 2}: ${e.message}`);
            }
        }
        return { imported, failed, errors };
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
        try {
            await item.populate([
                { path: 'category', select: 'name' },
                { path: 'brand', select: 'name' },
                { path: 'style', select: 'name' },
                { path: 'occasion', select: 'name' },
                { path: 'seasonCode', select: 'name' },
                { path: 'neckline', select: 'name' },
                { path: 'sleeveLength', select: 'name' }
            ]);
            const rawText = this.buildItemDescription(item);
            this.logger.log(`Raw text: ${rawText}`);
            const embedding = await this.geminiService.generateEmbedding(rawText);
            this.logger.log(`Generated embedding for item ${item._id}`);
            this.logger.log(`Embedding: ${embedding}`);
            await this.chromaService.upsertItemVector(item._id.toString(), userId, embedding, {
                categoryId: item.category?._id?.toString() || '',
                color: item.color || '',
                seasonId: item.seasonCode?._id?.toString() || '',
                occasionId: item.occasion?._id?.toString() || ''
            });
        }
        catch (error) {
            this.logger.error(`Failed to sync item ${item._id} to vector DB`, error);
        }
        return item;
    }
    async remove(id, userId) {
        const result = await this.itemModel
            .deleteOne({ _id: id, owner: userId })
            .exec();
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('Item not found');
    }
    buildItemDescription(item) {
        const parts = [
            `Item: ${item.name}`,
            `Category: ${item.category}`,
            `Color: ${item.color}`,
            `Tags: ${item.tags?.join(', ')}`,
            `Material: ${item.material || 'unknown'}`,
        ];
        return parts.join('. ');
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = ItemsService_1 = __decorate([
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
        cloudinary_service_1.CloudinaryService,
        gemini_service_1.GeminiService,
        chroma_service_1.ChromaService])
], ItemsService);
//# sourceMappingURL=items.service.js.map