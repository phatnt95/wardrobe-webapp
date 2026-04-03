import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: '6612f3a9c0e4a1b2c3d4e5f6' })
  _id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+84901234567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/example/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Fashion enthusiast' })
  bio?: string;

  @ApiProperty({ example: true })
  isActive: boolean;
}
