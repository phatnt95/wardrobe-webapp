import { ApiProperty } from '@nestjs/swagger';

/**
 * A lightweight representation of a wardrobe item sent to Gemini.
 * Only text-based fields — no image URLs — to save tokens.
 */
export class WardrobeItemContextDto {
  id: string;
  name: string;
  category: string;
  color: string;
  tags: string[];
}

export class OotdItemDto {
  @ApiProperty({ example: '64f1a2b3c4e5f6a7b8c9d0e1', description: 'MongoDB _id of the recommended item' })
  _id: string;

  @ApiProperty({ example: 'Linen White Shirt', description: 'Item name' })
  name: string;

  @ApiProperty({ example: 'Top', description: 'Category name' })
  category: string;

  @ApiProperty({ example: 'White', description: 'Item color' })
  color: string;

  @ApiProperty({
    example: ['https://res.cloudinary.com/...'],
    description: 'Image URLs of the item',
    type: [String],
  })
  images: string[];
}

export class OotdResponseDto {
  @ApiProperty({
    type: [OotdItemDto],
    description: 'Array of recommended items forming the Outfit Of The Day',
  })
  items: OotdItemDto[];

  @ApiProperty({
    example: 'ai',
    enum: ['ai', 'fallback'],
    description: 'Source of the recommendation: "ai" = Gemini responded, "fallback" = rule-based logic was used',
  })
  source: 'ai' | 'fallback';

  @ApiProperty({
    example: 'Gemini suggested a light outfit suitable for 30°C and clear skies.',
    description: 'Human-readable explanation of why this outfit was chosen',
    required: false,
  })
  reason?: string;
}
