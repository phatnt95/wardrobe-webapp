import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Model } from 'mongoose';
import { Location } from './location.schema';
import { CreateLocationDto, UpdateLocationDto } from './dto/locations.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<Location>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(
    createLocationDto: CreateLocationDto,
    userId: string,
  ): Promise<Location> {
    const newLocation = new this.locationModel({
      ...createLocationDto,
      owner: userId,
    });

    const parent = createLocationDto.parent
      ? await this.locationModel.findById(createLocationDto.parent)
      : null;

    // Path stores parent-child IDs sequentially instead of generic slashes/names
    newLocation.path = parent
      ? `${parent.path}/${newLocation._id}`
      : newLocation._id.toString();

    const saved = await newLocation.save();

    await this.cacheManager.del('locations_tree');
    return saved;
  }

  async findAll(userId: string): Promise<Location[]> {
    return this.locationModel.find({ owner: userId }).exec();
  }

  async getLocationsTree(): Promise<any[]> {
    const locations = await this.locationModel.find().lean().exec();

    const locationMap = new Map();
    const tree: any[] = [];

    locations.forEach((loc: any) => {
      locationMap.set(loc._id.toString(), { ...loc, children: [] });
    });

    locationMap.forEach((loc) => {
      if (loc.parent) {
        const parentLoc = locationMap.get(loc.parent.toString());
        if (parentLoc) {
          parentLoc.children.push(loc);
        } else {
          tree.push(loc);
        }
      } else {
        tree.push(loc);
      }
    });

    return tree;
  }

  async findOne(id: string, userId: string): Promise<Location> {
    const location = await this.locationModel
      .findOne({ _id: id, owner: userId })
      .exec();
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
    userId: string,
  ): Promise<Location> {
    const location = await this.locationModel
      .findOne({ _id: id, owner: userId })
      .exec();
    if (!location) throw new NotFoundException('Location not found');

    const oldPath = location.path;
    let newPath = oldPath;

    // Check if parent is being updated
    if (
      updateLocationDto.parent !== undefined &&
      updateLocationDto.parent !== location.parent?.toString()
    ) {
      if (!updateLocationDto.parent) {
        newPath = id;
      } else {
        const parent = await this.locationModel.findById(
          updateLocationDto.parent,
        );
        newPath = parent ? `${parent.path}/${id}` : id;
      }

      // Attach the new path to DTO to trigger update
      (updateLocationDto as any).path = newPath;
    }

    const updatedLocation = await this.locationModel.findOneAndUpdate(
      { _id: id, owner: userId },
      updateLocationDto,
      { new: true },
    );

    // If path changed, cascade the path update to all descendants
    if (oldPath && newPath && oldPath !== newPath) {
      const descendants = await this.locationModel.find({
        path: new RegExp(`^${oldPath}/`),
        owner: userId,
      });

      for (const desc of descendants) {
        const descNewPath = desc.path.replace(
          new RegExp(`^${oldPath}`),
          newPath,
        );
        await this.locationModel.updateOne(
          { _id: desc._id },
          { $set: { path: descNewPath } },
        );
      }
    }

    await this.cacheManager.del('locations_tree');
    return updatedLocation!;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.locationModel
      .deleteOne({ _id: id, owner: userId })
      .exec();
    if (result.deletedCount === 0)
      throw new NotFoundException('Location not found');

    await this.cacheManager.del('locations_tree');
  }
}
