import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Owner } from '../../../../libs/shared/src/schema/owner.schema';
import { Model } from 'mongoose';
import { OwnerDto } from '@app/shared';

@Injectable()
export class OwnerService {
  constructor(
    @InjectModel(Owner.name) private ownerModel: Model<Owner>,
  ){}

  create(createOwnerDto: OwnerDto) {
    this.ownerModel.create(createOwnerDto);
  }

  findAll() {
    return `This action returns all owner`;
  }

  findOne(id: number) {
    return `This action returns a #${id} owner`;
  }

  update(id: number, updateOwnerDto: OwnerDto) {
    return `This action updates a #${id} owner`;
  }

  remove(id: number) {
    return `This action removes a #${id} owner`;
  }
}
