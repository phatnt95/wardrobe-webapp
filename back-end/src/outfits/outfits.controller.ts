import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OutfitsService } from './outfits.service';
import { CreateOutfitDto } from './dto/create-outfit.dto';
import { UpdateOutfitDto } from './dto/update-outfit.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FeatureLimitGuard } from '../license/guards/feature-limit.guard';
import { RequireFeature } from '../license/decorators/require-feature.decorator';

@ApiTags('outfits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Post()
  @UseGuards(FeatureLimitGuard)
  @RequireFeature('outfits')
  @ApiOperation({ summary: 'Create outfit (enforces plan outfit limit)' })
  create(@Body() createOutfitDto: CreateOutfitDto, @CurrentUser() user: any) {
    return this.outfitsService.create(createOutfitDto, user._id);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.outfitsService.findAll(user._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.outfitsService.findOne(id, user._id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOutfitDto: UpdateOutfitDto,
    @CurrentUser() user: any,
  ) {
    return this.outfitsService.update(id, updateOutfitDto, user._id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.outfitsService.remove(id, user._id);
  }
}
