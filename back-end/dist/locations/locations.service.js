"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const location_schema_1 = require("./location.schema");
let LocationsService = class LocationsService {
    locationModel;
    constructor(locationModel) {
        this.locationModel = locationModel;
    }
    async create(createLocationDto, userId) {
        const parent = createLocationDto.parent ? await this.locationModel.findById(createLocationDto.parent) : null;
        const path = parent ? `${parent.path}${parent._id}/` : '/';
        const newLocation = new this.locationModel({
            ...createLocationDto,
            path,
            owner: userId,
        });
        return newLocation.save();
    }
    async findAll(userId) {
        return this.locationModel.find({ owner: userId }).exec();
    }
    async findOne(id, userId) {
        const location = await this.locationModel.findOne({ _id: id, owner: userId }).exec();
        if (!location)
            throw new common_1.NotFoundException('Location not found');
        return location;
    }
    async update(id, updateLocationDto, userId) {
        const location = await this.locationModel.findOneAndUpdate({ _id: id, owner: userId }, updateLocationDto, { new: true });
        if (!location)
            throw new common_1.NotFoundException('Location not found');
        return location;
    }
    async remove(id, userId) {
        const result = await this.locationModel.deleteOne({ _id: id, owner: userId }).exec();
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('Location not found');
    }
};
exports.LocationsService = LocationsService;
exports.LocationsService = LocationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(location_schema_1.Location.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LocationsService);
//# sourceMappingURL=locations.service.js.map