import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/locations.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.schema';

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(
    @Body() createLocationDto: CreateLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.locationsService.create(createLocationDto, user._id);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.locationsService.findAll(user._id);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get all locations as a nested tree' })
  @ApiResponse({
    status: 200,
    description: 'Return all locations structured as a nested tree',
  })
  @UseInterceptors(CacheInterceptor)
  @CacheKey('locations_tree')
  @CacheTTL(3600000) // 1 hour 
  getLocationsTree() {
    return this.locationsService.getLocationsTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.locationsService.findOne(id, user._id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.locationsService.update(id, updateLocationDto, user._id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.locationsService.remove(id, user._id);
  }
}
