import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StorageNode } from '@app/shared/schema/storagenode.schema';
import { Model } from 'mongoose';

@Injectable()
export class StoragesService {
  constructor(@InjectModel('StorageNode') private storageNodeModel: Model<StorageNode>) {}
  async create(createStorageDto: any) {
    await this.storageNodeModel.create(createStorageDto);
    return 'Storage created';
  }

  findAll() {
    return `This action returns all storages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} storage`;
  }

  update(id: number, updateStorageDto: any) {
    return `This action updates a #${id} storage`;
  }

  remove(id: number) {
    return `This action removes a #${id} storage`;
  }
}
