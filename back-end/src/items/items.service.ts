import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class ItemsService {
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
  ) {}

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
    return newItem.save();
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
    return item;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.itemModel
      .deleteOne({ _id: id, owner: userId })
      .exec();
    if (result.deletedCount === 0)
      throw new NotFoundException('Item not found');
  }
}
