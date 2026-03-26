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
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const favorite_schema_1 = require("./favorite.schema");
const items_service_1 = require("../items/items.service");
let FavoritesService = class FavoritesService {
    favoriteModel;
    itemsService;
    constructor(favoriteModel, itemsService) {
        this.favoriteModel = favoriteModel;
        this.itemsService = itemsService;
    }
    async create(createFavoriteDto, userId) {
        await this.itemsService.findOne(createFavoriteDto.item, userId);
        const existingFavorite = await this.favoriteModel.findOne({
            user: userId,
            item: createFavoriteDto.item,
        });
        if (existingFavorite) {
            throw new common_1.ConflictException('Item is already in favorites');
        }
        const newFavorite = new this.favoriteModel({
            user: userId,
            item: createFavoriteDto.item,
        });
        return newFavorite.save();
    }
    async findAll(userId) {
        return this.favoriteModel.find({ user: userId }).populate('item').exec();
    }
    async findOne(id, userId) {
        const favorite = await this.favoriteModel
            .findOne({ _id: id, user: userId })
            .populate('item')
            .exec();
        if (!favorite)
            throw new common_1.NotFoundException('Favorite not found');
        return favorite;
    }
    async removeByItemId(itemId, userId) {
        const result = await this.favoriteModel
            .deleteOne({ item: itemId, user: userId })
            .exec();
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('Favorite not found');
    }
    async remove(id, userId) {
        const result = await this.favoriteModel
            .deleteOne({ _id: id, user: userId })
            .exec();
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('Favorite not found');
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(favorite_schema_1.Favorite.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        items_service_1.ItemsService])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map