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
  UploadedFile,
  UploadedFiles,
  Res,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto } from './dto/items.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FeatureLimitGuard } from '../license/guards/feature-limit.guard';
import { RequireFeature } from '../license/decorators/require-feature.decorator';

@ApiTags('items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseGuards(FeatureLimitGuard)
  @RequireFeature('items')
  @UseInterceptors(FilesInterceptor('file', 2))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create item (enforces plan item limit)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        location: { type: 'string' },
        brand: { type: 'string' },
        category: { type: 'string' },
        color: { type: 'string' },
        size: { type: 'string' },
        style: { type: 'string' },
        seasonCode: { type: 'string' },
        neckline: { type: 'string' },
        occasion: { type: 'string' },
        sleeveLength: { type: 'string' },
        shoulder: { type: 'string' },
        file: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  create(
    @Body() createItemDto: CreateItemDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @CurrentUser() user: any,
  ) {
    return this.itemsService.create(createItemDto, files, user._id);
  }

  @Post('auto-detect')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Auto detect item from image and process in background',
  })
  @ApiResponse({ status: 202, description: 'Accepted' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async autoDetect(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Res() res: any,
  ) {
    const item = await this.itemsService.autoDetect(
      file,
      user._id || user.userId,
    );
    return res.status(202).json({
      message: 'Image queued for processing',
      itemId: item._id,
    });
  }

  @Get('export-template')
  @ApiOperation({ summary: 'Download Excel template for bulk item import' })
  async exportTemplate(@Res() res: any) {
    const buffer = await this.itemsService.exportTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename=wardrobe-import-template.xlsx',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk import items from Excel file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async importItems(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.itemsService.importData(file, user._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = parseInt(page as any, 10) || 1;
    const limitNumber = parseInt(limit as any, 10) || 20;
    return this.itemsService.findAll(user._id, pageNumber, limitNumber);
  }

  @Get('attributes')
  @ApiOperation({ summary: 'Get all item attributes/metadata grouped by type' })
  @ApiResponse({
    status: 200,
    description: 'Return grouped metadata like Brand, Category, etc.',
  })
  @UseInterceptors(CacheInterceptor)
  @CacheKey('items_attributes')
  @CacheTTL(3600000) // 1 hour
  findAllAttributes() {
    return this.itemsService.findAllAttributes();
  }

  @Post('attributes/:type')
  @ApiOperation({ summary: 'Create a new metadata attribute' })
  @ApiBody({
    schema: { type: 'object', properties: { name: { type: 'string' } } },
  })
  createAttribute(@Param('type') type: string, @Body() body: { name: string }) {
    return this.itemsService.createAttribute(type, body.name);
  }

  @Patch('attributes/:type/:id')
  @ApiOperation({ summary: 'Update an existing metadata attribute' })
  @ApiBody({
    schema: { type: 'object', properties: { name: { type: 'string' } } },
  })
  updateAttribute(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    return this.itemsService.updateAttribute(type, id, body.name);
  }

  @Delete('attributes/:type/:id')
  @ApiOperation({ summary: 'Delete a metadata attribute' })
  removeAttribute(@Param('type') type: string, @Param('id') id: string) {
    return this.itemsService.removeAttribute(type, id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.itemsService.findOne(id, user._id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('file', 2))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        location: { type: 'string' },
        brand: { type: 'string' },
        category: { type: 'string' },
        color: { type: 'string' },
        size: { type: 'string' },
        style: { type: 'string' },
        seasonCode: { type: 'string' },
        neckline: { type: 'string' },
        occasion: { type: 'string' },
        sleeveLength: { type: 'string' },
        shoulder: { type: 'string' },
        file: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @CurrentUser() user: any,
  ) {
    return this.itemsService.update(id, updateItemDto, files, user._id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.itemsService.remove(id, user._id);
  }
}
