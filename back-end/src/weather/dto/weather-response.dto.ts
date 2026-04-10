import { ApiProperty } from '@nestjs/swagger';

export class WeatherResponseDto {
  @ApiProperty({ example: 28.5, description: 'Current temperature in Celsius' })
  temperature: number;

  @ApiProperty({
    example: 30.1,
    description: 'Feels-like temperature in Celsius',
  })
  feelsLike: number;

  @ApiProperty({ example: 72, description: 'Humidity percentage' })
  humidity: number;

  @ApiProperty({ example: '10d', description: 'OpenWeatherMap icon code' })
  iconCode: string;

  @ApiProperty({
    example: 'https://openweathermap.org/img/wn/10d@2x.png',
    description: 'Full URL for the weather icon',
  })
  iconUrl: string;

  @ApiProperty({
    example: 'Rain',
    description: 'General weather condition (e.g. Rain, Clear, Clouds)',
  })
  condition: string;

  @ApiProperty({
    example: 'moderate rain',
    description: 'Short human-readable weather description',
  })
  description: string;

  @ApiProperty({
    example: 'Ho Chi Minh City',
    description: 'City name resolved from coordinates',
  })
  cityName: string;
}
