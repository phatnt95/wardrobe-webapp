import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Item ID' })
  @IsString()
  @IsNotEmpty()
  item: string;
}
