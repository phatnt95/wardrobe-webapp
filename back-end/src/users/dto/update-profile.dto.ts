import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBodyMeasurementsDto {
  @ApiPropertyOptional({ example: 175, description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ example: 68, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ example: 92 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  chest?: number;

  @ApiPropertyOptional({ example: 76 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waist?: number;

  @ApiPropertyOptional({ example: 98 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hips?: number;
}

export class UpdateStylePreferencesDto {
  @ApiPropertyOptional({ type: [String], example: ['Casual', 'Streetwear'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteStyles?: string[];

  @ApiPropertyOptional({ type: [String], example: ['#FFFFFF', '#000000'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colorPalette?: string[];
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+84901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1995-06-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Fashion enthusiast 🌟' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => UpdateBodyMeasurementsDto)
  measurements?: UpdateBodyMeasurementsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => UpdateStylePreferencesDto)
  stylePreferences?: UpdateStylePreferencesDto;
}
