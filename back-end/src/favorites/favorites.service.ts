import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite } from './favorite.schema';
import { CreateFavoriteDto } from './dto/favorites.dto';
import { ItemsService } from '../items/items.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<Favorite>,
    private itemsService: ItemsService,
  ) {}

  async create(
    createFavoriteDto: CreateFavoriteDto,
    userId: string,
  ): Promise<Favorite> {
    // Check if item exists and belongs to user
    await this.itemsService.findOne(createFavoriteDto.item, userId);

    const existingFavorite = await this.favoriteModel.findOne({
      user: userId,
      item: createFavoriteDto.item,
    });

    if (existingFavorite) {
      throw new ConflictException('Item is already in favorites');
    }

    const newFavorite = new this.favoriteModel({
      user: userId,
      item: createFavoriteDto.item,
    });
    return newFavorite.save();
  }

  async findAll(userId: string): Promise<Favorite[]> {
    return this.favoriteModel.find({ user: userId }).populate('item').exec();
  }

  async findOne(id: string, userId: string): Promise<Favorite> {
    const favorite = await this.favoriteModel
      .findOne({ _id: id, user: userId })
      .populate('item')
      .exec();
    if (!favorite) throw new NotFoundException('Favorite not found');
    return favorite;
  }

  async removeByItemId(itemId: string, userId: string): Promise<void> {
    const result = await this.favoriteModel
      .deleteOne({ item: itemId, user: userId })
      .exec();
    if (result.deletedCount === 0)
      throw new NotFoundException('Favorite not found');
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.favoriteModel
      .deleteOne({ _id: id, user: userId })
      .exec();
    if (result.deletedCount === 0)
      throw new NotFoundException('Favorite not found');
  }
}
