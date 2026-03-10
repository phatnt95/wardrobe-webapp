import { Injectable } from '@nestjs/common';

@Injectable()
export class AttributesService {
  create(createAttributeDto: any) {
    return 'This action adds a new attribute';
  }

  findAll() {
    return `This action returns all attributes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} attribute`;
  }

  update(id: number, updateAttributeDto: any) {
    return `This action updates a #${id} attribute`;
  }

  remove(id: number) {
    return `This action removes a #${id} attribute`;
  }
}
