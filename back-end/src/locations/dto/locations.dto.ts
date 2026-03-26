import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NodeType } from '../location.schema';

export class CreateLocationDto {
  @ApiProperty({ example: 'My Closet' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: NodeType, example: NodeType.CABINET })
  @IsEnum(NodeType)
  type: NodeType;

  @ApiPropertyOptional({
    example: '60d0fe4f5311236168a109ca',
    description: 'Parent Location ID',
  })
  @IsOptional()
  @IsString()
  parent?: string;
}

export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'My Closet Updated' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ enum: NodeType, example: NodeType.CABINET })
  @IsOptional()
  @IsEnum(NodeType)
  type?: NodeType;

  @ApiPropertyOptional({ example: '60d0fe4f5311236168a109ca' })
  @IsOptional()
  @IsString()
  parent?: string;
}
