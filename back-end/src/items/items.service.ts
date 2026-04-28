import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Model } from 'mongoose';
import { ImageAsset, Item } from './item.schema';
import { CreateItemDto, UpdateItemDto } from './dto/items.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ItemDescriptionHelper } from './item-description.helper';
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
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

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
    @InjectQueue('image-processing') private imageProcessingQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
      case 'Brand':
        return this.brandModel;
      case 'Category':
        return this.categoryModel;
      case 'Neckline':
        return this.necklineModel;
      case 'Occasion':
        return this.occasionModel;
      case 'SeasonCode':
        return this.seasonCodeModel;
      case 'SleeveLength':
        return this.sleeveLengthModel;
      case 'Style':
        return this.styleModel;
      case 'Size':
        return this.sizeModel;
      case 'Shoulder':
        return this.shoulderModel;
      default:
        throw new NotFoundException('Invalid attribute type');
    }
  }

  async createAttribute(type: string, name: string) {
    const model = this.getModelByType(type);
    const saved = await new model({ name }).save();
    await this.cacheManager.del('items_attributes');
    return saved;
  }

  async updateAttribute(type: string, id: string, name: string) {
    const model = this.getModelByType(type);
    const updated = await model.findByIdAndUpdate(id, { name }, { new: true });
    await this.cacheManager.del('items_attributes');
    return updated;
  }

  async removeAttribute(type: string, id: string) {
    const model = this.getModelByType(type);
    const removed = await model.findByIdAndDelete(id);
    await this.cacheManager.del('items_attributes');
    return removed;
  }

  async create(
    createItemDto: CreateItemDto,
    files: Array<Express.Multer.File>,
    userId: string,
  ): Promise<Item> {
    const images: string[] = [];
    const imageAssets: ImageAsset[] = [];
    console.log(files);

    if (files && files.length > 0) {
      for (const file of files) {
        const uploadResult = await this.cloudinaryService.uploadImage(file);
        const parsed = JSON.parse(JSON.stringify(uploadResult));
        this.logger.log(`Uploaded image: ${parsed}`);
        images.push(uploadResult.secure_url);
        imageAssets.push({
          publicId: uploadResult.public_id,
          imageUrl: uploadResult.secure_url,
        });
      }
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
      imageAssets,
      owner: userId,
    });
    this.logger.log(`New item: ${newItem}`);
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
        { path: 'sleeveLength', select: 'name' },
      ]);
      const rawText = ItemDescriptionHelper.build(savedItem);
      // this.logger.log(`Raw text: ${rawText}`);
      const embedding = await this.geminiService.generateEmbedding(rawText);
      // this.logger.log(`Generated embedding for item ${savedItem._id}`);
      // this.logger.log(`Embedding: ${embedding}`);
      await this.chromaService.upsertItemVector(
        savedItem._id.toString(),
        userId,
        embedding,
        {
          categoryId: savedItem.category?._id?.toString() || '',
          color: savedItem.color || '',
          seasonId: savedItem.seasonCode?._id?.toString() || '',
          occasionId: savedItem.occasion?._id?.toString() || '',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync item ${savedItem._id} to vector DB`,
        error,
      );
    }

    return savedItem;
  }

  async autoDetect(file: Express.Multer.File, userId: string): Promise<Item> {
    if (!file) throw new NotFoundException('No file provided');

    // Mặc định tạo item với status processing
    const defaultLocation = null; // Cần logic nếu require location
    // Do location schema có thể require, có thể ta set cứng 1 location mặc định không?
    // Hoặc sửa location.schema.ts không require? Wait, check item array - location trong schema là required.

    // 1. Upload Cloudinary ngay
    const uploadResult = await this.cloudinaryService.uploadImage(file);

    // 2. Tao item processing
    const newItem = new this.itemModel({
      name: 'Analyzing...',
      status: 'processing',
      images: [uploadResult.secure_url],
      owner: userId,
      location: '60d0fe4f5311236168a109ca', // Dummy location to bypass constraint, ideally use user's default location. We will update later if needed.
    });
    const savedItem = await newItem.save();

    // this.geminiService.autoDetectAttributes(uploadResult.secure_url);
    // 3. Queue job
    await this.imageProcessingQueue.add('detect-clothing', {
      itemId: savedItem._id.toString(),
      imageUrl: uploadResult.secure_url,
      userId: userId.toString(),
    }, {
      attempts: 5, // Cho phép thử tối đa 5 lần nếu thất bại
      backoff: {
        type: 'exponential',
        delay: 10000, // Lần 1 lỗi -> đợi 10s. Lần 2 lỗi -> đợi 20s. Lần 3 lỗi -> đợi 40s...
      },
      removeOnComplete: true, // Xong việc thì dọn rác
      removeOnFail: false, // Thất bại hẳn (sau 5 lần) thì giữ lại để dev vào soi log
    });

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

    worksheet.addRow([
      'Sample Blue Denim',
      'A lightweight denim jacket',
      49.99,
      'Levi',
      'Jacket',
      'Blue',
    ]);
    worksheet.addRow([
      'Basic White Tee',
      'Cotton t-shirt',
      15.0,
      'Uniqlo',
      'Top',
      'White',
    ]);

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
          color: row.getCell(6).value?.toString() || '',
        });
      }
    });

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [index, record] of records.entries()) {
      try {
        if (!record.name) throw new Error('Name is required');

        let brandId = null;
        if (record.brandName) {
          let brand = await this.brandModel.findOne({
            name: new RegExp(`^${record.brandName}$`, 'i'),
          });
          if (!brand)
            brand = await new this.brandModel({
              name: record.brandName,
            }).save();
          brandId = brand._id;
        }

        let catId = null;
        if (record.catName) {
          let cat = await this.categoryModel.findOne({
            name: new RegExp(`^${record.catName}$`, 'i'),
          });
          if (!cat)
            cat = await new this.categoryModel({ name: record.catName }).save();
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
          images: [],
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

  async findAll(userId: string, page: number = 1, limit: number = 20): Promise<{ data: Item[], total: number, page: number, totalPages: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.itemModel
        .find({ owner: userId })
        .populate('category location')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.itemModel.countDocuments({ owner: userId })
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
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
    files: Array<Express.Multer.File>,
    userId: string,
  ): Promise<Item> {
    const updateData: any = { ...updateItemDto };

    if (files && files.length > 0) {
      const item = await this.itemModel.findOne({ _id: id, owner: userId });
      if (item) {
        const newImages = [...item.images];
        const newImageAssets = [...item.imageAssets];
        for (const file of files) {
          const uploadResult = await this.cloudinaryService.uploadImage(file);
          newImages.push(uploadResult.secure_url);
          newImageAssets.push({
            publicId: uploadResult.public_id,
            imageUrl: uploadResult.secure_url,
          });
        }
        updateData.images = newImages;
        updateData.imageAssets = newImageAssets;
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
        { path: 'sleeveLength', select: 'name' },
      ]);
      const rawText = ItemDescriptionHelper.build(item);
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
          occasionId: item.occasion?._id?.toString() || '',
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

  async updateImageByPublicId(publicId: string, newSecureUrl: string): Promise<void> {
    const items = await this.itemModel.find({ 'imageAssets.publicId': publicId });
    for (const item of items) {
      let updated = false;
      const newImages = [...item.images];

      for (let i = 0; i < item.imageAssets.length; i++) {
        if (item.imageAssets[i].publicId === publicId) {
          const oldUrl = item.imageAssets[i].imageUrl;
          item.imageAssets[i].imageUrl = newSecureUrl;
          item.markModified('imageAssets');

          if (oldUrl) {
            const idx = newImages.indexOf(oldUrl);
            if (idx !== -1) {
              newImages[idx] = newSecureUrl;
            }
          }
          updated = true;
        }
      }

      if (updated) {
        item.images = newImages;
        await item.save();
        this.logger.log(`Updated images for item ${item._id} based on publicId ${publicId}`);
      }
    }
  }
}
