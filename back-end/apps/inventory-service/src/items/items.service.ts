import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Item } from '@app/shared/schema/item.schema';
import { ItemDto } from '@app/shared';

@Injectable()
export class ItemsService {

  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
  ) { }

  async create(itemDto: ItemDto) {
    const item = await this.itemModel.create(itemDto);
    return {
      message: 'Created item successfull.',
      id: item._id
    };
  }

  async findAll() {
    const items = await this.itemModel.find();
    return items;
  }

  findOne(id: number) {
    return `This action returns a #${id} item`;
  }

  update(id: number, updateItemDto: any) {
    return `This action updates a #${id} item`;
  }

  remove(id: number) {
    return `This action removes a #${id} item`;
  }
}
