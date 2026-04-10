import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOutfitDto } from './dto/create-outfit.dto';
import { UpdateOutfitDto } from './dto/update-outfit.dto';
import { Outfit, OutfitDocument } from './outfit.schema';

@Injectable()
export class OutfitsService {
  constructor(
    @InjectModel(Outfit.name) private outfitModel: Model<OutfitDocument>,
  ) {}

  create(createOutfitDto: CreateOutfitDto, userId: string): Promise<Outfit> {
    const createdOutfit = new this.outfitModel({
      ...createOutfitDto,
      owner: userId,
    });
    return createdOutfit.save();
  }

  findAll(userId: string): Promise<Outfit[]> {
    return this.outfitModel
      .find({ owner: userId })
      .populate('items.item')
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Outfit> {
    const outfit = await this.outfitModel
      .findOne({ _id: id, owner: userId })
      .populate('items.item')
      .exec();
    if (!outfit) {
      throw new NotFoundException(`Outfit with ID ${id} not found`);
    }
    return outfit;
  }

  async update(
    id: string,
    updateOutfitDto: UpdateOutfitDto,
    userId: string,
  ): Promise<Outfit> {
    const updatedOutfit = await this.outfitModel
      .findOneAndUpdate(
        { _id: id, owner: userId },
        { $set: updateOutfitDto },
        { new: true },
      )
      .populate('items.item')
      .exec();

    if (!updatedOutfit) {
      throw new NotFoundException(`Outfit with ID ${id} not found`);
    }
    return updatedOutfit;
  }

  async remove(id: string, userId: string): Promise<Outfit> {
    const deletedOutfit = await this.outfitModel
      .findOneAndDelete({ _id: id, owner: userId })
      .exec();

    if (!deletedOutfit) {
      throw new NotFoundException(`Outfit with ID ${id} not found`);
    }
    return deletedOutfit;
  }
}
