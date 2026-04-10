import { ApiProperty } from '@nestjs/swagger';
import { WeatherResponseDto } from '../../weather/dto/weather-response.dto';
import {
  OotdItemDto,
  OotdResponseDto,
} from '../../recommendation/dto/ootd-response.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Recent Item Widget
// ─────────────────────────────────────────────────────────────────────────────

export class RecentItemDto {
  @ApiProperty({ example: '64f1a2b3c4e5f6a7b8c9d0e1' })
  _id: string;

  @ApiProperty({ example: 'Linen White Shirt' })
  name: string;

  @ApiProperty({ example: 'Top' })
  category: string;

  @ApiProperty({ example: 'White' })
  color: string;

  @ApiProperty({ type: [String], example: ['https://res.cloudinary.com/...'] })
  images: string[];

  @ApiProperty({ example: '2024-03-20T10:00:00.000Z' })
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wardrobe Stats Widget
// ─────────────────────────────────────────────────────────────────────────────

export class WardrobeStatsDto {
  @ApiProperty({
    example: 42,
    description: 'Total number of items in the wardrobe',
  })
  totalItems: number;

  @ApiProperty({
    example: 1240.5,
    description: 'Total estimated value of all items (sum of prices)',
  })
  totalValue: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Dashboard Response
// ─────────────────────────────────────────────────────────────────────────────

export class DashboardResponseDto {
  @ApiProperty({
    type: WeatherResponseDto,
    description: "Current weather at the user's location",
  })
  weather: WeatherResponseDto;

  @ApiProperty({
    type: OotdResponseDto,
    description: 'AI-powered Outfit Of The Day recommendation',
  })
  ootd: OotdResponseDto;

  @ApiProperty({
    type: [RecentItemDto],
    description: 'Last 5 items added to the wardrobe',
  })
  recentItems: RecentItemDto[];

  @ApiProperty({
    type: WardrobeStatsDto,
    description: 'Aggregate statistics of the wardrobe',
  })
  stats: WardrobeStatsDto;
}

// Re-export child types so Orval can pick up all nested schemas from one import
export { WeatherResponseDto, OotdResponseDto, OotdItemDto };
