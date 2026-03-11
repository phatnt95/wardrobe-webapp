import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/favorites.dto';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    create(createFavoriteDto: CreateFavoriteDto, user: any): Promise<import("./favorite.schema").Favorite>;
    findAll(user: any): Promise<import("./favorite.schema").Favorite[]>;
    findOne(id: string, user: any): Promise<import("./favorite.schema").Favorite>;
    removeByItemId(itemId: string, user: any): Promise<void>;
    remove(id: string, user: any): Promise<void>;
}
