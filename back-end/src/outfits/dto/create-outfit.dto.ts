import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Season } from '../outfit.schema';

export class OutfitItemDto {
  @ApiProperty({ description: 'Item ObjectId' })
  @IsMongoId()
  item: string;

  @ApiProperty()
  @IsNumber()
  x: number;

  @ApiProperty()
  @IsNumber()
  y: number;

  @ApiProperty()
  @IsNumber()
  width: number;

  @ApiProperty()
  @IsNumber()
  height: number;

  @ApiProperty()
  @IsNumber()
  zIndex: number;
}

export class CreateOutfitDto {
  @ApiProperty({ example: 'Summer Vacation Walk' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Lightweight and breezy outfit for summer.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [OutfitItemDto],
    description: 'Array of Items with spatial properties',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutfitItemDto)
  items: OutfitItemDto[];

  @ApiPropertyOptional({ type: [String], example: ['casual', 'summer'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: Season, default: Season.All })
  @IsOptional()
  @IsEnum(Season)
  season?: Season;
}
