import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca' })
  @IsString()
  _id: string;

  @ApiProperty({ example: 'ITEM_PROCESSED' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Item Processed' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Your item White T-Shirt has been analyzed successfully.',
  })
  @IsString()
  message: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isRead: boolean;

  @ApiPropertyOptional({ example: '/items/60d0fe4f5311236168a109cb' })
  @IsOptional()
  @IsString()
  linkTarget?: string;

  @ApiProperty({ example: '2023-11-20T10:00:00Z' })
  @IsString()
  createdAt: string;
}

export class MarkReadDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isRead: boolean;
}
