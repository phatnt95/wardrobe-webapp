import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/favorites.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Post()
    create(@Body() createFavoriteDto: CreateFavoriteDto, @CurrentUser() user: any) {
        return this.favoritesService.create(createFavoriteDto, user._id);
    }

    @Get()
    findAll(@CurrentUser() user: any) {
        return this.favoritesService.findAll(user._id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.favoritesService.findOne(id, user._id);
    }

    @Delete('item/:itemId')
    removeByItemId(@Param('itemId') itemId: string, @CurrentUser() user: any) {
        return this.favoritesService.removeByItemId(itemId, user._id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.favoritesService.remove(id, user._id);
    }
}
