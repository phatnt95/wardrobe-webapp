import { 
  IsString, IsOptional, IsNumber, IsArray, 
  IsMongoId, IsNotEmpty 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemDto {
  @ApiProperty({ example: 'Áo sơ mi lụa' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Áo mặc đi làm, chất liệu mát' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 550000 })
  @IsOptional()
  @IsNumber()
  price?: number;

  // --- METADATA REFERENCES (ObjectIDs) ---
  
  @ApiProperty({ description: 'ID của Brand', example: '65b4...' })
  @IsOptional()
  @IsMongoId()
  brand?: string;

  @ApiProperty({ description: 'ID của Category' })
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiProperty({ description: 'ID của Color' })
  @IsOptional()
  @IsMongoId()
  color?: string;

  @ApiProperty({ description: 'ID của Size' })
  @IsOptional()
  @IsMongoId()
  size?: string;

  @ApiProperty({ description: 'ID của Style' })
  @IsOptional()
  @IsMongoId()
  style?: string;

  @ApiProperty({ description: 'ID của Neckline' })
  @IsOptional()
  @IsMongoId()
  neckline?: string;

  @ApiProperty({ description: 'ID của Sleeve Length' })
  @IsOptional()
  @IsMongoId()
  sleeveLength?: string;

  @ApiProperty({ description: 'ID của Shoulder' })
  @IsOptional()
  @IsMongoId()
  shoulder?: string;

  @ApiProperty({ description: 'ID của Occasion' })
  @IsOptional()
  @IsMongoId()
  occasion?: string;

  @ApiProperty({ description: 'ID của Season Code' })
  @IsOptional()
  @IsMongoId()
  seasonCode?: string;

  // --- STORAGE & IMAGES ---

  @ApiProperty({ description: 'ID của StorageNode (Vị trí tủ đồ)', required: true })
  @IsMongoId()
  @IsNotEmpty()
  storage: string;

  @ApiProperty({ type: [String], description: 'Danh sách URLs ảnh từ Media Service' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ type: [String], example: ['vintage', 'office'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  // Lưu ý: owner thường được lấy trực tiếp từ JWT Token trong Controller, 
  // không nên để client gửi lên để đảm bảo bảo mật.
}