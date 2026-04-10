import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item } from './item.schema';
import { GeminiService } from '../chroma/gemini.service';
import { ChromaService } from '../chroma/chroma.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { ItemDescriptionHelper } from './item-description.helper';
import { Category, Style, Occasion, Brand, SeasonCode, SleeveLength, Neckline, Shoulder, Size } from './metadata.schema';

@Injectable()
@Processor('image-processing')
export class ImageProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessingProcessor.name);

  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Style.name) private styleModel: Model<Style>,
    @InjectModel(Occasion.name) private occasionModel: Model<Occasion>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    @InjectModel(SeasonCode.name) private seasonCodeModel: Model<SeasonCode>,
    @InjectModel(SleeveLength.name) private sleeveLengthModel: Model<SleeveLength>,
    @InjectModel(Neckline.name) private necklineModel: Model<Neckline>,
    @InjectModel(Shoulder.name) private shoulderModel: Model<Shoulder>,
    @InjectModel(Size.name) private sizeModel: Model<Size>,
    private readonly geminiService: GeminiService,
    private readonly chromaService: ChromaService,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  private async getOrCreateMetadata(
    model: Model<any>,
    name: string,
  ): Promise<string | null> {
    if (!name || name.trim() === '') return null;
    let doc = await model.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (!doc) {
      doc = await new model({ name }).save();
    }
    return doc._id.toString();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { itemId, imageUrl, userId } = job.data;
    this.logger.log(`Processing image for item ${itemId}`);

    try {
      const [
        categories, styles, occasions, brands, seasonCodes,
        sleeveLengths, necklines, shoulders, sizes
      ] = await Promise.all([
        this.categoryModel.find().lean().exec(),
        this.styleModel.find().lean().exec(),
        this.occasionModel.find().lean().exec(),
        this.brandModel.find().lean().exec(),
        this.seasonCodeModel.find().lean().exec(),
        this.sleeveLengthModel.find().lean().exec(),
        this.necklineModel.find().lean().exec(),
        this.shoulderModel.find().lean().exec(),
        this.sizeModel.find().lean().exec(),
      ]);

      const extractedStr = await this.geminiService.autoDetectAttributes(
        imageUrl,
        {
          categories: categories.map((c: any) => c.name),
          styles: styles.map((s: any) => s.name),
          occasions: occasions.map((o: any) => o.name),
          brands: brands.map((b: any) => b.name),
          seasonCodes: seasonCodes.map((s: any) => s.name),
          sleeveLengths: sleeveLengths.map((s: any) => s.name),
          necklines: necklines.map((n: any) => n.name),
          shoulders: shoulders.map((s: any) => s.name),
          sizes: sizes.map((s: any) => s.name),
        }
      );

      const [
        catId, styleId, occasionId, brandId, seasonCodeId,
        sleeveLengthId, necklineId, shoulderId, sizeId
      ] = await Promise.all([
        this.getOrCreateMetadata(this.categoryModel, extractedStr.category),
        this.getOrCreateMetadata(this.styleModel, extractedStr.style),
        this.getOrCreateMetadata(this.occasionModel, extractedStr.occasion),
        this.getOrCreateMetadata(this.brandModel, extractedStr.brand),
        this.getOrCreateMetadata(this.seasonCodeModel, extractedStr.seasonCode),
        this.getOrCreateMetadata(this.sleeveLengthModel, extractedStr.sleeveLength),
        this.getOrCreateMetadata(this.necklineModel, extractedStr.neckline),
        this.getOrCreateMetadata(this.shoulderModel, extractedStr.shoulder),
        this.getOrCreateMetadata(this.sizeModel, extractedStr.size),
      ]);

      const updateData: any = {
        name: extractedStr.name,
        color: extractedStr.color,
        status: 'completed',
      };

      if (catId) updateData.category = catId;
      if (styleId) updateData.style = styleId;
      if (occasionId) updateData.occasion = occasionId;
      if (brandId) updateData.brand = brandId;
      if (seasonCodeId) updateData.seasonCode = seasonCodeId;
      if (sleeveLengthId) updateData.sleeveLength = sleeveLengthId;
      if (necklineId) updateData.neckline = necklineId;
      if (shoulderId) updateData.shoulder = shoulderId;
      if (sizeId) updateData.size = sizeId;

      const updatedItem = await this.itemModel
        .findOneAndUpdate({ _id: itemId }, updateData, { new: true })
        .populate('category style occasion brand seasonCode sleeveLength neckline shoulder size');

      // Send to vector db
      if (updatedItem) {
        const rawText = ItemDescriptionHelper.build(updatedItem);
        const embedding = await this.geminiService.generateEmbedding(rawText);
        await this.chromaService.upsertItemVector(
          updatedItem._id.toString(),
          userId,
          embedding,
          {
            categoryId: updatedItem.category?.toString() || '',
            color: updatedItem.color || '',
            seasonId: '',
            occasionId: updatedItem.occasion?.toString() || '',
          },
        );
      }

      // Notify User
      await this.notificationsService.create({
        user: userId,
        type: 'ITEM_PROCESSED',
        title: 'Item Analyzed Successfully',
        message: `Your item "${extractedStr.name}" has been analyzed.`,
        linkTarget: `/item/${itemId}`,
      });

      this.eventsGateway.notifyUser(userId, 'itemCompleted', {
        itemId,
        item: updatedItem,
      });

      return updatedItem;
    } catch (error) {
      this.logger.error(`Failed to process item ${itemId}:`, error);

      await this.itemModel.findOneAndDelete(
        { _id: itemId }
      );
      // await this.itemModel.findOneAndUpdate(
      //   { _id: itemId },
      //   { status: 'failed', name: 'Analysis Failed' },
      // );

      await this.notificationsService.create({
        user: userId,
        type: 'ITEM_FAILED',
        title: 'Image Analysis Failed',
        message: 'We could not detect the item in the image. Please try again.',
        linkTarget: `/item/${itemId}`,
      });

      this.eventsGateway.notifyUser(userId, 'itemFailed', { itemId });
      throw error;
    }
  }
}
