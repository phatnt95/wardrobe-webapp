import { IsString, IsOptional, IsArray, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Season } from '../outfit.schema';

export class CreateOutfitDto {
  @ApiProperty({ example: 'Summer Vacation Walk' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Lightweight and breezy outfit for summer.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String], description: 'Array of Item ObjectIds' })
  @IsArray()
  @IsMongoId({ each: true })
  items: string[];

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
