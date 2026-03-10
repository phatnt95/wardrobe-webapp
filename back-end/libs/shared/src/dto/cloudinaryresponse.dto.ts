import { ApiProperty } from '@nestjs/swagger';

export class CloudinaryResponseDto {
  @ApiProperty({
    example: 'wardrobe_app/shoes_v1',
    description: 'ID định danh trên Cloudinary',
  })
  public_id: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/.../image.jpg',
    description: 'URL ảnh gốc',
  })
  url: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/.../f_auto,q_auto/image.jpg',
    description: 'URL đã tối ưu',
  })
  optimizedUrl: string;
}

 