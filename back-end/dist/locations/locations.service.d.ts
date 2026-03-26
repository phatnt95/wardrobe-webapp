import { Model } from 'mongoose';
import { Location } from './location.schema';
import { CreateLocationDto, UpdateLocationDto } from './dto/locations.dto';
export declare class LocationsService {
    private locationModel;
    constructor(locationModel: Model<Location>);
    create(createLocationDto: CreateLocationDto, userId: string): Promise<Location>;
    findAll(userId: string): Promise<Location[]>;
    getLocationsTree(): Promise<any[]>;
    findOne(id: string, userId: string): Promise<Location>;
    update(id: string, updateLocationDto: UpdateLocationDto, userId: string): Promise<Location>;
    remove(id: string, userId: string): Promise<void>;
}
