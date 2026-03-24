import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @ApiProperty({ example: 'White T-Shirt' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Basic white t-shirt' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 15.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 'Zara' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'T-Shirt' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Casual' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ example: 'Summer' })
  @IsOptional()
  @IsString()
  seasonCode?: string;

  @ApiPropertyOptional({ example: 'V-Neck' })
  @IsOptional()
  @IsString()
  neckline?: string;

  @ApiPropertyOptional({ example: 'Casual' })
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiPropertyOptional({ example: 'Short' })
  @IsOptional()
  @IsString()
  sleeveLength?: string;

  @ApiPropertyOptional({ example: 'Drop' })
  @IsOptional()
  @IsString()
  shoulder?: string;

  @ApiPropertyOptional({ type: [String], example: ['casual', 'summer'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'Location ID',
  })
  @IsString()
  location: string;
}

export class UpdateItemDto {
  @ApiPropertyOptional({ example: 'White T-Shirt' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Basic white t-shirt' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 15.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 'Zara' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'T-Shirt' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Casual' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ example: 'Summer' })
  @IsOptional()
  @IsString()
  seasonCode?: string;

  @ApiPropertyOptional({ example: 'V-Neck' })
  @IsOptional()
  @IsString()
  neckline?: string;

  @ApiPropertyOptional({ example: 'Casual' })
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiPropertyOptional({ example: 'Short' })
  @IsOptional()
  @IsString()
  sleeveLength?: string;

  @ApiPropertyOptional({ example: 'Drop' })
  @IsOptional()
  @IsString()
  shoulder?: string;

  @ApiPropertyOptional({ type: [String], example: ['casual', 'summer'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({
    example: '60d0fe4f5311236168a109ca',
    description: 'Location ID',
  })
  @IsOptional()
  @IsString()
  location?: string;
}
