import { ApiProperty } from '@nestjs/swagger';

export class LicenseLimitsDto {
  @ApiProperty({ description: 'Max items allowed. -1 = unlimited' })
  maxItems: number;

  @ApiProperty({ description: 'Max outfits allowed. -1 = unlimited' })
  maxOutfits: number;

  @ApiProperty()
  aiFeatures: boolean;

  @ApiProperty()
  importExport: boolean;

  @ApiProperty()
  analytics: boolean;
}

export class LicenseResponseDto {
  @ApiProperty({ enum: ['free', 'pro', 'premium'] })
  plan: string;

  @ApiProperty({ enum: ['active', 'expired', 'cancelled'] })
  status: string;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty({ nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ type: LicenseLimitsDto })
  limits: LicenseLimitsDto;
}
