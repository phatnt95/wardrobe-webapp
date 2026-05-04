import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ enum: ['free', 'pro', 'premium'] })
  @IsIn(['free', 'pro', 'premium'])
  plan: 'free' | 'pro' | 'premium';
}
