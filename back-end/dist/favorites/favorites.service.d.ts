import { Model } from 'mongoose';
import { Favorite } from './favorite.schema';
import { CreateFavoriteDto } from './dto/favorites.dto';
import { ItemsService } from '../items/items.service';
export declare class FavoritesService {
    private favoriteModel;
    private itemsService;
    constructor(favoriteModel: Model<Favorite>, itemsService: ItemsService);
    create(createFavoriteDto: CreateFavoriteDto, userId: string): Promise<Favorite>;
    findAll(userId: string): Promise<Favorite[]>;
    findOne(id: string, userId: string): Promise<Favorite>;
    removeByItemId(itemId: string, userId: string): Promise<void>;
    remove(id: string, userId: string): Promise<void>;
}
