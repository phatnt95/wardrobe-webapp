import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item } from './item.schema';
import { CreateItemDto, UpdateItemDto } from './dto/items.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  Brand,
  Category,
  Neckline,
  Occasion,
  SeasonCode,
  SleeveLength,
  Style,
  Size,
  Shoulder,
} from './metadata.schema';
import { GeminiService } from 'src/chroma/gemini.service';
import { ChromaService } from 'src/chroma/chroma.service';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Neckline.name) private necklineModel: Model<Neckline>,
    @InjectModel(Occasion.name) private occasionModel: Model<Occasion>,
    @InjectModel(SeasonCode.name) private seasonCodeModel: Model<SeasonCode>,
    @InjectModel(SleeveLength.name)
    private sleeveLengthModel: Model<SleeveLength>,
    @InjectModel(Style.name) private styleModel: Model<Style>,
    @InjectModel(Size.name) private sizeModel: Model<Size>,
    @InjectModel(Shoulder.name) private shoulderModel: Model<Shoulder>,
    private cloudinaryService: CloudinaryService,
    private readonly geminiService: GeminiService,
    private readonly chromaService: ChromaService,
  ) { }

  async findAllAttributes() {
    const [
      brands,
      categories,
      necklines,
      occasions,
      seasonCodes,
      sleeveLengths,
      styles,
      sizes,
      shoulders,
    ] = await Promise.all([
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

  private getModelByType(type: string): Model<any> {
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
      default: throw new NotFoundException('Invalid attribute type');
    }
  }

  async createAttribute(type: string, name: string) {
    const model = this.getModelByType(type);
    return new model({ name }).save();
  }

  async updateAttribute(type: string, id: string, name: string) {
    const model = this.getModelByType(type);
    return model.findByIdAndUpdate(id, { name }, { new: true });
  }

  async removeAttribute(type: string, id: string) {
    const model = this.getModelByType(type);
    return model.findByIdAndDelete(id);
  }

  async create(
    createItemDto: CreateItemDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Item> {
    const images: string[] = [];
    console.log(file);

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      images.push(uploadResult.secure_url);
    }

    const itemData = { ...createItemDto } as Record<string, any>;

    // Explicitly nullify empty string relationships to avoid MongoDB CastError for ObjectId
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
      if (
        !itemData[field] ||
        itemData[field] === 'undefined' ||
        itemData[field] === 'null'
      ) {
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
      // Chỉ select trường 'name' để truy vấn DB nhẹ nhất có thể
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
      await this.chromaService.upsertItemVector(
        savedItem._id.toString(),
        userId,
        embedding,
        {
          categoryId: savedItem.category?._id?.toString() || '',
          color: savedItem.color || '',
          seasonId: savedItem.seasonCode?._id?.toString() || '',
          occasionId: savedItem.occasion?._id?.toString() || ''
        },
      );
    } catch (error) {
      this.logger.error(`Failed to sync item ${savedItem._id} to vector DB`, error);
    }


    return savedItem;
  }

  async exportTemplate(): Promise<Buffer> {
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

  async importData(file: Express.Multer.File, userId: string): Promise<any> {
    if (!file) throw new NotFoundException('No file provided');
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const records: any[] = [];
    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber > 1) {
        records.push({
          name: row.getCell(1).value?.toString() || '',
          description: row.getCell(2).value?.toString() || '',
          price: parseFloat(row.getCell(3).value as unknown as string) || 0,
          brandName: row.getCell(4).value?.toString() || '',
          catName: row.getCell(5).value?.toString() || '',
          color: row.getCell(6).value?.toString() || ''
        });
      }
    });

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [index, record] of records.entries()) {
      try {
        if (!record.name) throw new Error("Name is required");

        let brandId = null;
        if (record.brandName) {
          let brand = await this.brandModel.findOne({ name: new RegExp(`^${record.brandName}$`, 'i') });
          if (!brand) brand = await new this.brandModel({ name: record.brandName }).save();
          brandId = brand._id;
        }

        let catId = null;
        if (record.catName) {
          let cat = await this.categoryModel.findOne({ name: new RegExp(`^${record.catName}$`, 'i') });
          if (!cat) cat = await new this.categoryModel({ name: record.catName }).save();
          catId = cat._id;
        }

        const itemData: any = {
          name: record.name,
          description: record.description,
          price: record.price,
          color: record.color,
          brand: brandId,
          category: catId,
          owner: userId,
          images: []
        };

        if (!itemData.brand) delete itemData.brand;
        if (!itemData.category) delete itemData.category;

        await new this.itemModel(itemData).save();
        imported++;
      } catch (e: any) {
        failed++;
        errors.push(`Row ${index + 2}: ${e.message}`);
      }
    }

    return { imported, failed, errors };
  }

  async findAll(userId: string): Promise<Item[]> {
    return this.itemModel
      .find({ owner: userId })
      .populate('category location')
      .exec();
    // return this.itemModel.find({}).populate('category location').exec();
  }

  async findOne(id: string, userId: string): Promise<Item> {
    const item = await this.itemModel
      .findOne({ _id: id, owner: userId })
      .populate('location')
      .exec();
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Item> {
    const updateData: any = { ...updateItemDto };

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

    if (!item) throw new NotFoundException('Item not found');

    try {
      // Chỉ select trường 'name' để truy vấn DB nhẹ nhất có thể
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
      await this.chromaService.upsertItemVector(
        item._id.toString(),
        userId,
        embedding,
        {
          categoryId: item.category?._id?.toString() || '',
          color: item.color || '',
          seasonId: item.seasonCode?._id?.toString() || '',
          occasionId: item.occasion?._id?.toString() || ''
        },
      );
    } catch (error) {
      this.logger.error(`Failed to sync item ${item._id} to vector DB`, error);
    }

    return item;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.itemModel
      .deleteOne({ _id: id, owner: userId })
      .exec();
    if (result.deletedCount === 0)
      throw new NotFoundException('Item not found');
  }

  /**
   * Helper: Tạo chuỗi mô tả để "dạy" AI về món đồ
   */
  private buildItemDescription(item: any): string {
    const parts = [
      `Item: ${item.name}`,
      `Category: ${item.category}`,
      `Color: ${item.color}`,
      `Tags: ${item.tags?.join(', ')}`,
      `Material: ${item.material || 'unknown'}`,
    ];
    return parts.join('. ');
  }
}
