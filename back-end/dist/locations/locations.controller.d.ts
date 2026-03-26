import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/locations.dto';
export declare class LocationsController {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    create(createLocationDto: CreateLocationDto, user: any): Promise<import("./location.schema").Location>;
    findAll(user: any): Promise<import("./location.schema").Location[]>;
    getLocationsTree(): Promise<any[]>;
    findOne(id: string, user: any): Promise<import("./location.schema").Location>;
    update(id: string, updateLocationDto: UpdateLocationDto, user: any): Promise<import("./location.schema").Location>;
    remove(id: string, user: any): Promise<void>;
}
