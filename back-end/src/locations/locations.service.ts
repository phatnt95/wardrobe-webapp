import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location } from './location.schema';
import { CreateLocationDto, UpdateLocationDto } from './dto/locations.dto';

@Injectable()
export class LocationsService {
    constructor(@InjectModel(Location.name) private locationModel: Model<Location>) { }

    async create(createLocationDto: CreateLocationDto, userId: string): Promise<Location> {
        const parent = createLocationDto.parent ? await this.locationModel.findById(createLocationDto.parent) : null;
        const path = parent ? `${parent.path}${parent._id}/` : '/';

        const newLocation = new this.locationModel({
            ...createLocationDto,
            path,
            owner: userId,
        });
        return newLocation.save();
    }

    async findAll(userId: string): Promise<Location[]> {
        return this.locationModel.find({ owner: userId }).exec();
    }

    async findOne(id: string, userId: string): Promise<Location> {
        const location = await this.locationModel.findOne({ _id: id, owner: userId }).exec();
        if (!location) throw new NotFoundException('Location not found');
        return location;
    }

    async update(id: string, updateLocationDto: UpdateLocationDto, userId: string): Promise<Location> {
        const location = await this.locationModel.findOneAndUpdate(
            { _id: id, owner: userId },
            updateLocationDto,
            { new: true }
        );
        if (!location) throw new NotFoundException('Location not found');
        return location;
    }

    async remove(id: string, userId: string): Promise<void> {
        const result = await this.locationModel.deleteOne({ _id: id, owner: userId }).exec();
        if (result.deletedCount === 0) throw new NotFoundException('Location not found');
    }
}
