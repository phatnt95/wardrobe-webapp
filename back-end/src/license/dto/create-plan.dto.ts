import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  ValidateNested,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanLimitsDto {
  @ApiProperty({ description: 'Max items allowed. -1 = unlimited' })
  @IsNumber()
  maxItems: number;

  @ApiProperty({ description: 'Max outfits allowed. -1 = unlimited' })
  @IsNumber()
  maxOutfits: number;

  @ApiProperty()
  @IsBoolean()
  aiFeatures: boolean;

  @ApiProperty()
  @IsBoolean()
  importExport: boolean;

  @ApiProperty()
  @IsBoolean()
  analytics: boolean;
}

export class CreatePlanDto {
  @ApiProperty({ enum: ['free', 'pro', 'premium'] })
  @IsIn(['free', 'pro', 'premium'])
  name: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty({ type: CreatePlanLimitsDto })
  @ValidateNested()
  @Type(() => CreatePlanLimitsDto)
  limits: CreatePlanLimitsDto;
}
